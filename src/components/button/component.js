/* @flow */

import { SyncPromise } from 'sync-browser-mocks/src/promise';
import xcomponent from 'xcomponent/src';

import { config } from '../../config';
import { isDevice, redirect as redir } from '../../lib';

import { validateProps } from '../common';

// $FlowFixMe
import componentTemplate from './componentTemplate.htm';

export let Button = xcomponent.create({

    tag: 'paypal-button',
    name: 'ppbutton',

    buildUrl(instance) : string {
        let env = instance.props.env || config.env;

        return config.buttonUrls[env];
    },

    contexts: {
        iframe: true,
        lightbox: false,
        popup: false
    },

    scrolling: false,
    componentTemplate,

    get version() : string {
        return config.ppobjects ? __FILE_VERSION__ : __MINOR_VERSION__;
    },

    get domains() : Object {
        return config.paypalDomains;
    },

    validateProps(component, props, required = true) : void {
        if (required) {
            return validateProps(props);
        }
    },

    props: {

        env: {
            type: 'string',
            required: false,
            queryParam: true,

            def() : string {
                return config.env;
            }
        },

        client: {
            type: 'object',
            required: false,
            def() : Object {
                return {};
            },
            sendToChild: false
        },

        stage: {
            type: 'string',
            required: false,
            queryParam: true,

            def() : string {
                return config.stage;
            }
        },

        payment: {
            type: 'string',
            required: false,
            getter: true,
            memoize: false,
            alias: 'billingAgreement'
        },

        commit: {
            type: 'boolean',
            required: false
        },

        onAuthorize: {
            type: 'function',
            required: false,

            decorate(original) : ?Function {
                if (original) {
                    return function(data, actions) : void {

                        let redirect = (win, url) => {
                            return SyncPromise.all([
                                redir(win || window.top, url || data.returnUrl),
                                actions.close()
                            ]);
                        };

                        return original.call(this, data, { ...actions, redirect });
                    };
                }
            }
        },

        onCancel: {
            type: 'function',
            required: false,
            noop: true,

            decorate(original) : ?Function {
                if (original) {
                    return function(data, actions) : void {

                        let redirect = (win, url) => {
                            return SyncPromise.all([
                                redir(win || window.top, url || data.cancelUrl),
                                actions.close()
                            ]);
                        };
                        
                        return original.call(this, data, { ...actions, redirect });
                    };
                }
            }
        },

        onClick: {
            type: 'function',
            required: false
        },

        dimensions: {
            type: 'object',
            required: false,

            def(props) : { width : string | number, height : string | number } {
                let size = props.style && props.style.size || 'small';

                return {

                    tiny: {
                        width: '80px',
                        height: '22px'
                    },

                    small: {
                        width: '148px',
                        height: '48px'
                    },

                    medium: {
                        width: '230px',
                        height: '48px'
                    }

                }[size];
            }
        },
        
        locale: {
            type: 'string',
            required: false,
            queryParam: 'locale.x'
        },

        style: {
            type: 'object',
            required: false,
            queryParam: true,
            alias: 'buttonStyle',
            def() : Object {
                return {
                    color: 'gold',
                    shape: 'pill',
                    size:  'small',
                    label: 'checkout'
                };
            }
        },

        disableLightbox: {
            type: 'boolean',
            required: false,

            def() : boolean {
                let meta = document.querySelector('meta[name=viewport]');
                return isDevice() && !meta && ((window.screen && window.screen.width) < 660);
            }
        },

        testAction: {
            type: 'string',
            required: false,
            def() : string {
                return 'checkout';
            }
        }
    },

    autoResize: false,

    dimensions: {
        width: '148px',
        height: '48px'
    }
});
