/* @flow */

import $logger from 'beaver-logger/client';

import { config, ENV } from './config';
import { initLogger, checkForCommonErrors, beacon } from './lib';
import { enableCheckoutIframe } from './components';
import { setupBridge } from './compat';

import { SyncPromise } from 'sync-browser-mocks/src/promise';

function domainToEnv(domain : string) : ?string {
    for (let env of Object.keys(config.paypalUrls)) {
        if (config.paypalUrls[env] === domain) {
            return env;
        }
    }
}

function setDomainEnv(domain : string) {
    let currentDomainEnv = domainToEnv(domain);

    if (currentDomainEnv && currentDomainEnv !== 'test') {
        config.env = currentDomainEnv;
    }
}

setDomainEnv(`${window.location.protocol}//${window.location.host}`);

initLogger();

SyncPromise.onPossiblyUnhandledException((err : Error) => {

    beacon(`unhandled_error`, {
        message: err ? err.toString() : 'undefined',
        stack: err.stack || err.toString(),
        errtype: ({}).toString.call(err)
    });
});


type SetupOptions = {
    env? : ?string,
    stage? : ?string,
    apiStage? : ?string,
    paypalUrl? : ?string,
    state? : ?string,
    ppobjects? : ?boolean,
    lightbox? : ?boolean,
    bridge? : ?boolean
};

export function setup(options : SetupOptions = {}) {

    checkForCommonErrors();

    if (options.env) {
        if (!config.paypalUrls[options.env]) {
            throw new Error(`Invalid env: ${options.env}`);
        }

        delete config.env;
        config.env = options.env;
    }

    if (options.stage) {
        delete config.stage;
        config.stage = options.stage;
        if (!options.env) {
            delete config.env;
            config.env = ENV.STAGE;
        }
    }

    if (options.apiStage) {
        delete config.apiStage;
        config.apiStage = options.apiStage;
    }

    if (options.paypalUrl) {
        delete config.paypalUrl;
        config.paypalUrl = options.paypalUrl;
        setDomainEnv(config.paypalUrl);
    }

    if (options.state) {
        delete config.state;
        config.state = options.state;
    }

    if (options.ppobjects) {
        config.ppobjects = true;
    }

    if (options.lightbox) {
        enableCheckoutIframe();
    }

    if (options.bridge) {
        setupBridge(config.env);
    }

    $logger.info(`setup_${config.env}`);
}

function getCurrentScript() : ? HTMLScriptElement {

    let scripts = Array.prototype.slice.call(document.getElementsByTagName('script'));

    for (let script of scripts) {
        if (script.src && script.src.replace(/^https?:/, '').split('?')[0] === config.scriptUrl || script.hasAttribute('data-paypal-checkout')) {
            return script;
        }

        if (script.src && script.src.indexOf('paypal.checkout.v4.js') !== -1) {
            return script;
        }
    }

    if (document.currentScript) {
        $logger.debug(`current_script_not_recognized`, { src: document.currentScript.src });
    }
}

let currentScript = getCurrentScript();
let currentProtocol = window.location.protocol.split(':')[0];

$logger.debug(`current_protocol_${currentProtocol}`);

if (currentScript) {

    setup({
        env:       currentScript.getAttribute('data-env'),
        stage:     currentScript.getAttribute('data-stage'),
        apiStage:  currentScript.getAttribute('data-api-stage'),
        paypalUrl: currentScript.getAttribute('data-paypal-url'),
        state:     currentScript.getAttribute('data-state'),
        lightbox:  currentScript.hasAttribute('data-enable-lightbox'),
        bridge:    currentScript.hasAttribute('data-enable-bridge'),
        ppobjects: true
    });

    let scriptProtocol = currentScript.src.split(':')[0];

    $logger.debug(`current_script_protocol_${scriptProtocol}`);
    $logger.debug(`current_script_${ currentProtocol === scriptProtocol ? 'match' : 'mismatch' }_protocol`);

} else {
    $logger.debug(`no_current_script`);

    if (document.currentScript) {
        $logger.debug(`current_script_not_recognized`, { src: document.currentScript.src });
    }
}
