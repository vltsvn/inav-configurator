/*global mspHelper,$,GUI,MSP,BF_CONFIG,chrome*/
'use strict';

var helper = helper || {};

helper.defaultsDialog = (function() {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [{
            "title": 'Mini Quad with 3"-7" propellers',
            "settings": [
                {
                    key: "gyro_hardware_lpf",
                    value: "256HZ"
                },
                {
                    key: "looptime",
                    value: 500
                },
                {
                    key: "gyro_lpf_hz",
                    value: 100
                },
                {
                    key: "gyro_lpf_type",
                    value: "PT1"
                },
                {
                    key: "gyro_stage2_lowpass_hz",
                    value: 200
                },
                {
                    key: "dterm_lpf_hz",
                    value: 90
                },
                {
                    key: "use_dterm_fir_filter",
                    value: "OFF"
                },
                {
                    key: "mc_iterm_relax_type",
                    value: "RP"
                },
                {
                    key: "d_boost_factor",
                    value: 1.5
                },
                {
                    key: "antigravity_gain",
                    value: 2
                },
                {
                    key: "antigravity_accelerator",
                    value: 5
                },
                {
                    key: "rc_yaw_expo",
                    value: 70
                },
                {
                    key: "rc_expo",
                    value: 70
                },
                {
                    key: "roll_rate",
                    value: 70
                },
                {
                    key: "pitch_rate",
                    value: 70
                },
                {
                    key: "yaw_rate",
                    value: 60
                },
                {
                    key: "mc_p_pitch",
                    value: 44
                },
                {
                    key: "mc_i_pitch",
                    value: 60
                },
                {
                    key: "mc_d_pitch",
                    value: 25
                },
                {
                    key: "mc_p_roll",
                    value: 40
                },
                {
                    key: "mc_i_roll",
                    value: 50
                },
                {
                    key: "mc_d_roll",
                    value: 25
                },
                {
                    key: "mc_p_yaw",
                    value: 45
                },
                {
                    key: "mc_i_yaw",
                    value: 70
                },
                {
                    key: "mc_airmode_type",
                    value: "THROTTLE_THRESHOLD"
                },
                {
                    key: "applied_defaults",
                    value: 2
                }
            ],
            "features":[
                {
                    bit: 5, // Enable DYNAMIC_FILTERS
                    state: true
                }
            ]
        },
        {
            "title": 'Airplane',
            "id": 3,
            "settings": [
                {
                    key: "rc_yaw_expo",
                    value: 70
                },
                {
                    key: "rc_expo",
                    value: 70
                },
                {
                    key: "roll_rate",
                    value: 30
                },
                {
                    key: "pitch_rate",
                    value: 20
                },
                {
                    key: "yaw_rate",
                    value: 10
                },
                {
                    key: "small_angle",
                    value: 180
                },
                {
                    key: "applied_defaults",
                    value: 3
                }
            ],
            "features":[
                {
                    bit: 4, // Enable MOTOR_STOP
                    state: true
                }
            ]
        },
        {
            "title": 'Custom UAV - INAV legacy defaults',
            "settings": [
                {
                    key: "applied_defaults",
                    value: 1
                }
            ]
        },
        {
            "title": 'Keep current settings',
            "settings": [
                {
                    key: "applied_defaults",
                    value: 1
                }
            ]
        }
    ]

    publicScope.init = function() {
        mspHelper.getSetting("applied_defaults").then(privateScope.onInitSettingReturned);
        $container = $("#defaults-wrapper");
    };

    privateScope.setFeaturesBits = function (selectedDefaultPreset) {

        if (selectedDefaultPreset.features && selectedDefaultPreset.features.length > 0) {
            helper.features.reset();

            for (const feature of selectedDefaultPreset.features) {
                if (feature.state) {
                    helper.features.set(feature.bit);
                } else {
                    helper.features.unset(feature.bit);
                }
            }

            helper.features.execute(function () {
                privateScope.setSettings(selectedDefaultPreset);
            });
        } else {
            privateScope.setSettings(selectedDefaultPreset);
        }
    };

    privateScope.setSettings = function (selectedDefaultPreset) {
        Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
            return mspHelper.getSetting(input.key);
        }).then(function () {
            Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
                return mspHelper.setSetting(input.key, input.value);
            }).then(function () {
                mspHelper.saveToEeprom(function () {
                    //noinspection JSUnresolvedVariable
                    GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
            
                    GUI.tab_switch_cleanup(function() {
                        MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                            //noinspection JSUnresolvedVariable
                            GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                            GUI.handleReconnect();
                        });
                    });
                });
            })
        });
    };

    privateScope.onPresetClick = function(event) {
        $container.hide();
        let selectedDefaultPreset = data[$(event.currentTarget).data("index")];
        if (selectedDefaultPreset && selectedDefaultPreset.settings) {

            mspHelper.loadBfConfig(function () {
                privateScope.setFeaturesBits(selectedDefaultPreset)   
            });
        }
    };

    privateScope.render = function() {
        let $place = $container.find('.defaults-dialog__options');
        $place.html("");
        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                let preset = data[i];
                let $element = $("<div class='default_btn defaults_btn'>\
                        <a class='confirm' href='#'></a>\
                    </div>")

                $element.find("a").html(preset.title);
                $element.data("index", i).click(privateScope.onPresetClick)
                $element.appendTo($place);
            }
        }
    }

    privateScope.onInitSettingReturned = function(promise) {
        if (promise.value > 0) {
            return; //Defaults were applied, we can just ignore
        }

        privateScope.render();
        $container.show();
    }

    return publicScope;
})();