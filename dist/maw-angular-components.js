/**
 *
 * Account Details Service
 *
 */
(function (angular, undefined) {
    'use strict';

    var module = angular.module('MAW.Components.AccountDetails', []);

    module.factory('AccountDetailsService', [
        'ChartersAPI', 'Utils',
        function (ChartersAPI, Utils) {

            var AccountDetailsService = {};

            // Initially set to false to make checking easy
            AccountDetailsService.data = false;

            AccountDetailsService.getData = function () {
                return ChartersAPI.get('/account/').then(function (response) {
                    AccountDetailsService.data = response.data.data;
                    return response;
                });
            };

            /**
             * getValue
             * @param  {String} key             The key to lookup
             * @param  {*}      [defaultValue]  Default value if key does not exist
             * @return {*} Returns the corresponding value for the key or defaultValue.
             */
            AccountDetailsService.getValue = function (key, defaultValue) {
                return Utils.getObjectValue(AccountDetailsService.data, key, defaultValue);
            };

            return AccountDetailsService;

        }
    ]);

})(angular);

/**
 *
 * Initialize Angular with a call to the Bootstrap Service
 *
 */
(function (window) {
    'use strict';

    window.MAW = window.MAW || {};

    /**
     * initAngularWithBootstrap
     *
     * If not authenticated
     *     Redirect to Sign In page
     *
     * If authenticated
     *     Get Bootstrap data from API
     *     Create app constant with data
     *     Initalize the Angular app
     *
     * @param {string} appName The Angular app to init E.g. 'MAW.Journey.Portal'
     * @param {bool} authRedirect Whether or not to redirect the user if not authenticated
     * @param {object} windowRef Reference to the parent window
     * @param {string} element Reference to some element
     *
     */
    console.log('Defining initAngularWithBootstrap function');

    MAW.initAngularWithBootstrap = function (appName, authRedirect, windowRef, element) {

        var $injector = angular.injector(['MAW.Components']),
            $cookies = $injector.get('$cookies'),
            HostnameDiscoveryService = $injector.get('HostnameDiscoveryService'),
            ApplicationBootstrapService = $injector.get('ApplicationBootstrapService'),
            authCookie = HostnameDiscoveryService.getAuthTokenCookieName();

        if (typeof(authRedirect) !== 'boolean') {
            authRedirect = true;
        }

        // @todo Change authentication to be an ajax implementation
        // If not authenticated, redirect to Sign In page
        if (authRedirect && !angular.isString($cookies[authCookie])) {
            windowRef = windowRef || window;
            var urlParts  = [
                HostnameDiscoveryService.baseUrl('charters'),
                '/account/sign-in/?next=',
                windowRef.location.href
            ];
            windowRef.location = urlParts.join('');
            return;
        }

        ApplicationBootstrapService.getData().then(function () {

            // Store the data on the MAW object for future use
            MAW.bootstrapData = ApplicationBootstrapService.data;

            // Initialize the Angular app
            element = element || document;
            angular.element(element).ready(function () {
                angular.bootstrap(element, [appName]);
            });
        });

    };

})(window);

/**
 *
 * Application Bootstrap Service
 *
 */
(function (window, angular) {
    'use strict';

    var module = angular.module('MAW.Components.ApplicationBootstrap', [
        'MAW.Components.HostnameDiscovery'
    ]);

    /**
     * Application Bootstrap Service
     * Handles state and communications for bootstrap service
     * @return {object} service data and methods
     */
    module.factory('ApplicationBootstrapService', [
        '$http', 'ChartersAPI', 'Utils',
        function ($http, ChartersAPI, Utils) {

            // bootstrap service object
            var ApplicationBootstrapService = {};

            /**
             * data
             * contains data returned from /api/bootstrap/ method, as well
             * as any other necessary data
             * @type {object}
             */
            ApplicationBootstrapService.data = Utils.getObjectValue(window, 'MAW.bootstrapData');

            /**
             * getData
             * method to return bootstrap data
             * @return {promise} application bootstrap promise
             */
            ApplicationBootstrapService.getData = function () {
                return ChartersAPI.get('/bootstrap/').then(function (response) {
                    // set bootstrap data
                    ApplicationBootstrapService.data = response.data.data;
                });
            };

            /**
             * getFeatures
             * Method that fetches the available features and their values
             *
             * Example
             *     ApplicationBootstrapService.getFeatures(['admin']);
             *
             * @param  {Array} requestedFeatures  Feature keys to lookup
             * @return {Object}  The list of feature keys and their values or false if the feature is disabled
             */
            ApplicationBootstrapService.getFeatures = function (requestedFeatures) {

                /**
                 * @type {Object} features  Object to return
                 * @type {Array} enabledFeatures  Enabled features from Bootstrap API
                 * @type {Object} featuresMap  Map of keys and corresponding keys for values
                 */
                var features = {},
                    enabledFeatures,
                    featuresMap;

                enabledFeatures = ApplicationBootstrapService.getValue('features', []);

                featuresMap = {
                    'admin': 'application.admin_enabled'
                };

                // Iterate over requested features
                for (var i = 0; i < requestedFeatures.length; i++) {
                    var requestedFeature = requestedFeatures[i];

                    if (enabledFeatures.indexOf(requestedFeature) > -1) {

                        // If requested feature is enabled, get it's corresponding value
                        features[requestedFeature] = ApplicationBootstrapService.getValue(
                            featuresMap[requestedFeature]
                        );

                    } else {

                        // If requested feature is not enabled, set value to false
                        features[requestedFeature] = false;

                    }

                }

                return features;

            };

            ApplicationBootstrapService.getValue = function (key, defaultValue) {
                return Utils.getObjectValue(ApplicationBootstrapService.data, key, defaultValue);
            };

            return ApplicationBootstrapService;
        }
    ]);

})(window, angular);


/**
 *
 * Common Navigation Service
 *
 */
(function (angular) {
    'use strict';

    var module = angular.module('MAW.Components.CommonNavigation', [
        'ui.bootstrap',
        'ngCookies'
    ]);

    module.controller('CommonNavigationController', [
        '$cookies', 'CommonNavigationService', 'ApplicationBootstrapService', 'HostnameDiscoveryService',
        function ($cookies, CommonNavigationService, ApplicationBootstrapService, HostnameDiscoveryService) {

            var vm = this;

            /**
             * csrf
             * csrf token, which exists in Journey
             * @type {string}
             */
            vm.csrf = $cookies['csrftoken'];

            /**
             * brand
             * brand data returned from bootstrap
             * @type {[type]}
             */
            vm.brand = ApplicationBootstrapService.getValue('brand');

            /**
             * collapsed
             * flag to determine if header is open/closed
             * @type {Boolean}
             */
            vm.collapsed = true;

            /**
             * authenticated flag
             * @type {Boolean}
             */
            vm.authenticated = false;

            /**
             * urlFormAction
             * journey URL to do sign-in, password reset links
             * @type {string}
             */
            vm.formActionUrl = HostnameDiscoveryService.getUrl('journey', '/account/sign-in/');

            /**
             * urlForgotPassword
             * journey URL for forgot password page
             * @type {string}
             */
            vm.forgotPasswordUrl = HostnameDiscoveryService.getUrl(
                'charters',
                '/account/password-reset/'
            );

            /**
             * nextUrl
             * next parameter after sign in
             * @type {string}
             */
            vm.nextUrl = HostnameDiscoveryService.getUrl('charters', '/');

            /**
             * gotData
             * Indicator that tells the template that the
             * getData method has completed
             * @type {Boolean}
             */
            vm.gotData = false;

            /**
             * defaultBrandImage
             * The path of the default brand image to use
             * @type {String}
             */
            vm.defaultBrandImage = '/logos/logo.png';

            /**
             * SVG check: http://css-tricks.com/test-support-svg-img/
             */
            if (document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1')) {
                vm.defaultBrandImage = vm.defaultBrandImage.replace('.png', '.svg');
            }

            /**
             * getData
             * call to get data from service
             * @return {[type]} [description]
             */
            CommonNavigationService.getData().then(function () {
                vm.gotData = true;
                vm.data = CommonNavigationService.data;
                vm.authenticated = CommonNavigationService.authenticated;
            }, function () {
                vm.gotData = true;
            });
        }
    ]);

    module.factory('CommonNavigationService', [
        '$http', 'ChartersAPI',
        function ($http, ChartersAPI) {

            var CommonNavigationService = {};

            /**
             * data
             * navigation data returned from api
             * @type {Object}
             */
            CommonNavigationService.data = {};

            /**
             * authenticated
             * flag to show whether user is authenticated or not
             * @type {Boolean}
             */
            CommonNavigationService.authenticated = false;

            /**
             * getData
             * returns navigation data from api
             * @return {promise} GET request
             */
            CommonNavigationService.getData = function () {
                return ChartersAPI.get('/navigation/').then(function (response) {
                    CommonNavigationService.data = response.data.data;
                    CommonNavigationService.brand = CommonNavigationService.data.brand;
                    CommonNavigationService.authenticated = true;
                });
            };

            return CommonNavigationService;
        }
    ]);

    module.directive('commonNavigation', function () {
        return {
            restrict: 'E',
            controller: 'CommonNavigationController',
            controllerAs: 'commonNavigation',
            templateUrl: 'common-navigation/common-navigation.html'
        };
    });

})(angular);

/**
 *
 * Hostname Discovery Service
 *
 */
(function (angular, window) {
    'use strict';

    var module = angular.module('MAW.Components.HostnameDiscovery', []);

    /**
     * Hostname Discovery Service
     *
     * Provides methods of linking between applications within the same client+modifier environment.
     */
    module.factory('HostnameDiscoveryService', [
        '$sce',
        function ($sce) {

            var HostnameDiscoveryService = {};

            // Add known applicationName/port here
            var appPorts = {
                charters: 8000,
                chartersapi: 8001
            };

            /**
             * Given an applicationName and hostname, returns hostname containing the new applicationName
             *
             * @param  {string} applicationName E.g. 'charters'
             * @param  {string} hostname E.g. 'chartersapi-maw-local.codenaked.org'
             * @return {string}
             */
            var convertHostname = function (applicationName, hostname) {

                var port = HostnameDiscoveryService.getPort(),
                    finalPort = '';

                // Set the app port when in Dev Mode
                if (port !== '' && port !== 80 && port !== 443) {
                    finalPort = ':' + appPorts[applicationName];
                }

                return applicationName + '-' + hostname.split('-').slice(1).join('-') + finalPort;
            };

            /**
             * Returns current protocol
             * Should be private but we need to mock this
             *
             * @return {string} protocol
             */
            HostnameDiscoveryService.getProtocol = function () {
                return window.location.protocol;
            };

            /**
             * Returns current hostname
             * Should be private but we need to mock this
             *
             * @return {string} hostname
             */
            HostnameDiscoveryService.getHostname = function () {
                return window.location.hostname;
            };

            /**
             * Returns current port
             * Should be private but we need to mock this
             *
             * @return {string} port
             */
            HostnameDiscoveryService.getPort = function () {
                return window.location.port;
            };

            /**
             * Given an applicationName, returns corresponding baseUrl containing protocol and hostname. E.g.
             * HostnameDiscoveryService.baseUrl('portal') will return protocol://portal-client-modifier.domain
             *
             * @param  {string} applicationName
             * @return {string}
             */
            HostnameDiscoveryService.baseUrl = function (applicationName) {
                var protocol = HostnameDiscoveryService.getProtocol();
                var hostname = HostnameDiscoveryService.getHostname();

                return protocol + '//' + convertHostname(applicationName, hostname);
            };

            /**
             * Given an applicationName, returns corresponding hostname. E.g.
             * HostnameDiscoveryService.baseUrl('charters') returns charters-client-modifier.domain
             *
             * @param  {string} applicationName
             * @return {string}
             */
            HostnameDiscoveryService.host = function (applicationName) {
                return convertHostname(applicationName, HostnameDiscoveryService.getHostname());
            };

            /**
             * Returns the authentication cookie name for this application
             *
             * @return {string}
             */
            HostnameDiscoveryService.getAuthTokenCookieName = function () {

                // Set hostname array
                var hostnameArray = location.hostname.split('.')[0].split('-');

                // Remove app name
                hostnameArray.shift();

                // Remove version if present
                if (new RegExp(/^\d+$/).test(hostnameArray[1])) {
                    hostnameArray.splice(1, 1);
                }

                // Set the cookie name based on its app hostname
                return hostnameArray.join('-') + '-token';
            };

            HostnameDiscoveryService.getUrl = function (applicationName, path) {
                return $sce.trustAsResourceUrl(HostnameDiscoveryService.baseUrl(applicationName) + path);
            };

            return HostnameDiscoveryService;

        }
    ]);

})(angular, window);

/**
 *
 * MAW Components
 *
 */
(function (angular) {
    'use strict';

    var module = angular.module('MAW.Components', [
        'ngCookies',
        'ui.bootstrap',
        'MAW.Components.HostnameDiscovery',
        'MAW.Components.ChartersAPI',
        'MAW.Components.ApplicationBootstrap',
        'MAW.Components.AccountDetails',
        'MAW.Components.CommonNavigation',
        'MAW.Components.NewWindow'
    ]);

    module.constant('CLIENT_VER', '1.0');

    // Set default headers for http requests
    module.run([
        '$http', '$cookies', 'HostnameDiscoveryService',
        function ($http, $cookies, HostnameDiscoveryService) {

            // Get auth token cookie name
            var authTokenCookieName =  HostnameDiscoveryService.getAuthTokenCookieName();

            // Set the headers
            $http.defaults.headers.common['X-Authorization'] = $cookies[authTokenCookieName];
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        }
    ]);

    // Filters

    // loadFromCDN
    module.filter('loadFromCDN', [
        'ApplicationBootstrapService',
        function (ApplicationBootstrapService) {

            return function (url) {

                var cdnBaseUrl = ApplicationBootstrapService.getValue('application.cdn_base_url');

                if (cdnBaseUrl && url.match('^https?://') === null) {
                    url = cdnBaseUrl + url;
                }

                return url;
            };
        }
    ]);

})(angular);

/**
 *
 * Charters API Service
 *
 */
(function (window, angular) {
    'use strict';

    window.MAW = window.MAW || {};

    var module = angular.module('MAW.Components.ChartersAPI', []);

    module.factory('ChartersAPI', [
        '$http', '$q', 'HostnameDiscoveryService', 'Utils', 'CLIENT_VER',
        function ($http, $q, HostnameDiscoveryService, Utils, CLIENT_VER) {

            var ChartersAPI = {},
                apiVersion = Utils.getObjectValue(window, 'MAW.apiVersion');

            /**
             * fetchVersion
             * Returns stored version number if available otherwise
             * fetches correct API version based on current client version
             *
             * @return {function} Promise with API_VER
             */
            ChartersAPI.fetchVersion = function () {
                if (apiVersion) {
                    return $q.when(apiVersion);
                } else {
                    var apiUrl = ChartersAPI.getUrl('/' + CLIENT_VER + '/');
                    return $http.get(apiUrl).success(function (response) {
                        apiVersion = response.data.api_version;
                        window.MAW.apiVersion = apiVersion;
                    });
                }
            };

            /**
             * getUrl
             * Builds a complete API url using HostnameDiscoveryService.baseUrl
             * and the endpoint argument and optional applicationName argument
             *
             * @param  {String} endpoint        API endpoint
             * @param  {String} applicationName Optional and defaults to chartersapi
             * @return {String}                 Complete API url.
             */
            ChartersAPI.getUrl = function (endpoint, applicationName) {

                applicationName = applicationName || 'chartersapi';

                console.log('app name: ' + applicationName);
                var apiUrlParts = [
                    HostnameDiscoveryService.baseUrl(applicationName)
                ];
                console.log('base url: ' + apiUrlParts[0]);

                if (apiVersion) {
                    apiUrlParts.push('/' + apiVersion);
                }
                console.log('api version: ' + apiVersion);
                console.log('endpoint: ' + endpoint);
                apiUrlParts.push(endpoint);

                return apiUrlParts.join('');
            };

            /**
             * get
             * Wrapper for $http.get
             * Unlinke $http, you cannot use .success and .error
             *
             * @param  {String} endpoint        API endoint
             * @param  {Object} data            Optional data to be sent with the request
             * @param  {String} applicationName Optional
             * @return {Object}                 Returns a promise
             */
            ChartersAPI.get = function (endpoint, data, applicationName) {
                console.log('Making GET request to ' + endpoint);
                return httpRequest('get', endpoint, data, applicationName);
            };

            /**
             * post
             * Wrapper for $http.post
             * Unlinke $http, you cannot use .success and .error
             *
             * @param  {String} endpoint        API endoint
             * @param  {Object} data            Optional object to be sent with request
             * @param  {String} applicationName Optional
             * @return {Object}                 Returns a promise
             */
            ChartersAPI.post = function (endpoint, data, applicationName) {
                return httpRequest('post', endpoint, data, applicationName);
            };

            /**
             * httpRequest
             * Private method that wraps Angular's $http but calls fetchVersion first
             *
             * @param  {String} type            Methods of Angular's $http. (get, post, etc.)
             * @param  {String} endpoint        API Endpoint
             * @param  {Object} data            Optional object to be sent with request
             * @param  {String} applicationName Optional
             * @return {Object}                 Returns a promise
             */
            var httpRequest = function (type, endpoint, data, applicationName) {
                return ChartersAPI.fetchVersion().then(function (resp) {
                    var apiUrl = ChartersAPI.getUrl(endpoint, applicationName);
                    console.log('Endpoint ' + endpoint + ' maps to ' + apiUrl);
                    return $http[type](apiUrl, data);
                });
            };

            return ChartersAPI;

        }
    ]);

})(window, angular);

/**
 *
 * New Window Utility
 *
 */
(function (angular) {
    'use strict';

    var module = angular.module('MAW.Components.NewWindow', []);

    /**
     * New Window Directive
     *
     * Opens links in a new window.
     *
     * New window is chromeless and defaults to
     * 500px by 500px in the center of the screen.
     *
     * Accepts all params accepted by native window.open().
     *
     * Also accepts `stopPropagation=true` which will prevent the click event from bubbling up.
     *
     * Example Use
     *
     * <a href="http://teamexos.com" new-window>MAW</a>
     *
     * Example Use w/ Optional Params
     *
     * <a href="http://teamexos.com" new-window="width=480,height=750">MAW</a>
     *
     */
    module.directive('newWindow', [
        '$window',
        function ($window) {
            return {
                restirct: 'A',
                link: function (scope, element, attrs) {

                    var stopPropagation = false,
                        defaultParams = {
                            height: 500,
                            width: 500,
                            menubar: 'no',
                            toolbar: 'no',
                            personalbar: 'no',
                            status: 'no'
                        };

                    // Deconstruct custom params and merge into defaultParams
                    if (attrs.newWindow) {

                        var customParams = attrs.newWindow.split(',');

                        while (customParams.length) {

                            var paramParts = customParams.pop().split('=');

                            if (paramParts.length) {
                                defaultParams[paramParts[0]] = paramParts[1];
                            }

                        }

                    }

                    // If `width` and no `left`, default to horizontal center of screen
                    if (defaultParams.width && !defaultParams.left) {
                        defaultParams.left = ($window.screen.width / 2) - (defaultParams.width / 2);
                    }

                    // If `height` and no `top`, default to vertical center of screen
                    if (defaultParams.height && !defaultParams.top) {
                        defaultParams.top = ($window.screen.height / 2) - (defaultParams.height / 2);
                    }

                    // If `stopPropagation` was passed as a custom param
                    if (!angular.isUndefined(defaultParams.stopPropagation)) {

                        // Only change default value of false if it equals 'true'
                        if (defaultParams.stopPropagation === 'true') {
                            stopPropagation = true;
                        }

                        // Remove from defaultParams so it doesn't get sent to window.open
                        delete defaultParams.stopPropagation;
                    }

                    // Construct new params string
                    var params = [];

                    for (var param in defaultParams) {
                        params.push(param + '=' + defaultParams[param]);
                    }

                    params = params.join(',');

                    // On click, prevent defaults and open new window
                    element.on('click', function (e) {

                        if (attrs.href) {

                            e.preventDefault();

                            if (stopPropagation) {
                                e.stopPropagation();
                            }

                            $window.open(attrs.href, 'newWindow', params);

                        }

                    });

                }

            };

        }
    ]);

})(angular);

/**
 *
 * Array Prototype Extensions
 *
 */
(function () {
    'use strict';

    /**
     * Array.prototype.contains()
     * The contains() method determines whether an array contains a certain element, returning true or false as appropriate.
     *
     * Usage: array.contains(searchElement[, fromIndex])
     *
     */
    if (!('contains' in Array.prototype)) {
        Array.prototype.contains = function(arr, startIndex) {
            return ''.indexOf.call(this, arr, startIndex) !== -1;
        };
    }

    /**
     * Array.range()
     * range() method provides a new array with a range of numbers from 0 - n
     * @param {number} n: range of array to create
     * @param {number} startAt: number to start array at
     * From answer here:
     * http://stackoverflow.com/questions/8495687/split-array-into-chunks/10456644#10456644
     */
    if (!Array.range) {
        Array.range = function (n, startAt) {
            // Array.range(5) --> [0,1,2,3,4]
            return Array.apply(null, Array(n)).map(function(x,i){ return i + startAt });
        };
    }

    /**
     * Array.chunk
     * Returns chunks of an array
     * From answer here:
     * http://stackoverflow.com/questions/8495687/split-array-into-chunks/10456644#10456644
     * @type {[type]}
     */
    Object.defineProperty(Array.prototype, 'chunk', {
        value: function (n) {

            // ACTUAL CODE FOR CHUNKING ARRAY:
            return Array.range(Math.ceil(this.length/n)).map(function (x,i){
                return this.slice(i * n, i * n + n);
            }.bind(this));

        }
    });
})();

/**
 *
 * Utility Functions
 *
 */
(function (angular) {
    'use strict';

    var module = angular.module('MAW.Components');

    module.factory('Utils', [
        function () {
            var Utils = {};

            Utils.getObjectValue = function (object, key, defaultValue) {

                if (angular.isUndefined(defaultValue)) {
                    defaultValue = false;
                }

                if (angular.isObject(object)) {
                    var properties = key.split('.');
                    for (var i = 0; i < properties.length; i++) {
                        if (object.hasOwnProperty(properties[i])) {
                            object = object[properties[i]];
                            if (i === (properties.length - 1)) {
                                defaultValue = object;
                            }
                        } else {
                            break;
                        }
                    }
                }

                return defaultValue;
            };

            return Utils;
        }
    ]);
})(angular);


/**
 *
 * Pre-cache templates
 *
 */
(function (angular, undefined) {
    angular.module('MAW.Components').run(['$templateCache', function($templateCache) {
        'use strict';
        //
        //$templateCache.put('common-navigation/common-navigation.html',
        //    "<header class=\"common-navigation navbar navbar-default navbar-fixed-top\" role=navigation> <div ng-show=commonNavigation.gotData class=container> <div class=navbar-header> <button ng-click=\"commonNavigation.collapsed = !commonNavigation.collapsed\" type=button class=navbar-toggle> <span class=sr-only>Toggle navigation</span> <span class=icon-bar></span> <span class=icon-bar></span> <span class=icon-bar></span> </button> <a ng-href=\"{{ commonNavigation.brand.URI || '#' }}\" class=navbar-brand> <img ng-src=\"{{ commonNavigation.brand.image || commonNavigation.defaultBrandImage | loadFromCDN }}\" ng-attr-alt=\"{{ commonNavigation.brand.name || 'MAW' }}\" class=img-responsive data-aid-image-branding> </a> </div> <nav ng-if=commonNavigation.authenticated ng-class=\"{ in: !commonNavigation.collapsed }\" class=\"collapse navbar-collapse\"> <ul class=\"nav navbar-nav navbar-right\"> <li ng-repeat=\"link in commonNavigation.data.links\" class=dropdown>  <a ng-if=!link.links.length ng-href=\"{{ link.URI }}\" ng-attr-target=\"{{ link.browser_flags.indexOf('open_in_new_window') >= 0 ? '_blank' : '' }}\">{{ link.name }}</a>  <a ng-if=link.links.length href=# class=dropdown-toggle>{{ link.name }} <b class=caret></b></a>  <ul ng-if=link.links.length class=dropdown-menu> <li ng-repeat=\"dropdownLink in link.links\" ng-class=\"{ 'dropdown-header': !dropdownLink.URI }\"> <a ng-if=dropdownLink.URI ng-href=\"{{ dropdownLink.URI }}\">{{ dropdownLink.name }}</a> <span ng-if=!dropdownLink.URI>{{ dropdownLink.name }}</span> </li> </ul> </li> </ul> </nav> <form class=\"sign-in navbar-form navbar-right\" action=\"{{ commonNavigation.formActionUrl }}\" method=post ng-if=!commonNavigation.authenticated> <div class=form-group> <input type=hidden name=csrfmiddlewaretoken value=\"{{ commonNavigation.csrf }}\"> <input type=hidden name=next value=\"{{ commonNavigation.nextUrl }}\"> <input class=form-control id=email type=email name=email placeholder=Email tabindex=1 data-aid-input-landing-email><br> <label for=id_keep_signed_in data-aid-text-keep-signed-in> <input type=checkbox name=keep_signed_in id=id_keep_signed_in tabindex=3 data-aid-check-keep-signed-in> Keep me signed in </label> </div> <div class=form-group> <input class=form-control type=password name=password placeholder=Password tabindex=2 data-aid-input-password><br> <label><a ng-href=\"{{ commonNavigation.forgotPasswordUrl }}\">Forgot your password?</a></label> </div> <button class=\"btn btn-primary\" type=submit tabindex=4 data-aid-button-signin>Sign In</button> </form> </div> </header>"
        //);
        //
        //
        //$templateCache.put('motivation-statements/motivation-statements.html',
        //    "<section class=motivation-statements> <carousel interval=motivationStatements.interval> <slide ng-if=!motivationStatements.reassessment ng-repeat=\"slide in motivationStatements.statements\" active=slide.active> <div class=carousel-caption> <h2>“{{ slide.text }}”</h2> </div> </slide> <slide ng-if=motivationStatements.reassessment active=slide.active> <div class=carousel-caption> <h3 ng-if=motivationStatements.monthsSince> It’s been {{ motivationStatements.monthsSince }} <ng-pluralize count=motivationStatements.monthsSince when=\"{ 'one': 'month', 'other': 'months' }\"></ng-pluralize> since you last updated your Performance Profile. </h3> <h4><a ng-href=\"{{ motivationStatements.reassessmentUrl }}\">Update your Performance Profile now.</a></h4> </div> </slide> </carousel> <div class=\"container edit-button-wrap\"> <a ng-if=!motivationStatements.reassessment ng-href=\"{{ motivationStatements.editUrl }}\" class=\"btn btn-xs btn-default edit-button\">Edit</a> </div> </section>"
        //);

    }]);
})(angular);
