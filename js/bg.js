var BackgroundController;

BackgroundController = (function () {
    var initOtherLibrary, airbrake,onMessage, onMessageExternal, webNavigation, notificationsParams, need_resync_report;
    initOtherLibrary = function (callback) {
        chrome.storage.local.get({
            'airbrake_js': null
        }, function (items) {
            if (items.airbrake_js) {
                airbrake = new AirbrakeController(items.airbrake_js.projectId, items.airbrake_js.projectKey);
            }else{
                airbrake = new AirbrakeController(items.airbrake_js, items.airbrake_js);
            }
            callback();
        });
    };
    notificationsParams = function (type, request) {
        return {
            priority: 1,
            type: type,
            iconUrl: icon_url,
            title: request.title,
            message: request.info
        };
    };
    onMessage = function () {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            switch (request.type) {
                case 'shownotification':
                    chrome.notifications.create('notify', request.opt, function () {});
                    break;
                case 'wrong_account':
                    chrome.tabs.update({url: 'https://apps.admob.com/logout?continue=https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD'}, function (tab) {
                        chrome.notifications.create(notificationsParams('basic', request), function () {})
                    });
                    break;
                case 'update_plugin':
                    chrome.tabs.update({url: 'https://chrome.google.com/webstore/detail/appodeal/cnlfcihkilpkgdlnhjonhkfjjmbpbpbj'}, function (tab) {
                        chrome.notifications.create(notificationsParams('basic', request), function () {})
                    });
                    break;
                default:
                    break;
            }
        });
    };
    onMessageExternal = function () {
        chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
            switch (request.type) {
                case 'admob_notification':
                    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {type: 'to_admob', data: request}, function (response) {
                            console.log(response);
                        });
                    });
                    break;
                case 'console_email_notification':
                    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {type: 'to_console', data: request}, function (response) {
                            console.log(response);
                        });
                    });
                    break;
                default:
                    break;
            }
        });
    };
    webNavigation = function () {
        chrome.webNavigation.onCompleted.addListener(function (details) {
            chrome.storage.local.get("reporting_tab_id", function (result) {
                if (result['reporting_tab_id'] && details.tabId.toString() === result['reporting_tab_id'].toString()) {
                    var details_url = details.url.toString();
                    if (details_url.match(/\/apiui\/credential/) || details_url.match(/credentials\?project=/) || details_url.match(/credentials\/oauthclient\?project=/) || details_url.match(/credentials\?highlightClient=/) || details_url.match(/apis\/credentials\/oauthclient\//)) {
                        chrome.tabs.executeScript(details.tabId, {
                            file: "js/reporting_step4.js"
                        });
                    } else if (details_url.match(/\/apiui\/consent/) || details_url.match(/consent\?project=/)) {
                        chrome.tabs.executeScript(details.tabId, {
                            file: "js/reporting_step3.js"
                        });
                    } else if (details_url.match(/apps\.admob\.com\/(\/v2)?/)) {
                        console.log(details_url);
                        chrome.tabs.executeScript(details.tabId, {
                            file: "js/get_admob_account.js"
                        });
                    } else if (details_url.match(/adsense\/overview/) || details_url.match(/adsensehost.googleapis.com/) || details_url.match(/adsense.googleapis.com/)) {
                        chrome.tabs.executeScript(details.tabId, {
                            file: "js/reporting_step2.js"
                        });
                    } else if (details_url.match(/projectselector\/apis\/credentials/)) {
                        chrome.tabs.executeScript(details.tabId, {
                            file: "js/library.js"
                        });
                    }
                }
            });
        });
    };
    need_resync_report = function () {
        chrome.storage.local.get({
            'credential_error': null
        }, function (items) {
            // credential_error
            if (items.credential_error) {
                $.each(items.credential_error, function(key,val) {
                    var title = 'Appodeal Chrome Extension';
                    var message = 'Sorry, the action of your Token expired \n'+ val.email + '( ' + val.publisher_id + '). Please re-sync account!';
                    var params = notificationsParams('basic', { title: title, info: message});
                    chrome.notifications.create(params, function () {})
                });
            }
        });
    };
    return {
        init: function () {
            initOtherLibrary(function () {
                airbrake.error.call(need_resync_report);
                airbrake.error.call(webNavigation);
                airbrake.error.call(onMessage);
                airbrake.error.call(onMessageExternal);
            });
        }
    };
})();

$(document).ready(function () {
    BackgroundController.init();
});
