'use strict';

window.EXOS = window.EXOS || {};

window.EXOS.apiVersion = '1.0';

var mockLocation,
    mockApplicationBootstrapData;

beforeEach(function () {

    module('EXOS.Components');

    mockLocation = {
        protocol: 'http:',
        hostname: 'journeyapi-exos-local.teamexos.com',
        port: 8001
    };

    mockApplicationBootstrapData = {
        'status': 200,
        'message': 'Success',
        'csrf_token': 'EGR4RJM89GHRT94466H745G978S2Z7N1',
        'data': {
            'brand': {
                'name': 'EXOS',
                'URI': '#',
                'image': 'http://www.teamexos.com/media/images/logos/0bc0dd89.signal-orange.png'
            },
            'user': {
                'id': 123456,
                'name': 'Test User',
                'email': 'user@test.com',
                'timezone': 'UTC'
            },
            'application': {
                'is_production': true,
                'is_qa': false,
                'dev_tools_enabled': false,
                'application_version': '2.2.5',
                'cdn_base_url': '//a248.e.akamai.net/=/743/1265/origin.static.fuelforit.com/',
                'registration_enabled': true,
                'keep_me_sign_in_duration': 365,
                'journey_plus': true,
                'journey_enable_uid': false,
                'journey_uid_required': false,
                'journey_uid_type': null,
                'journey_uid_min_length': null,
                'journey_uid_max_length': null,
                'journey_enable_ops_id': true,
                'journey_sms_enabled': false,
                'journey_terms_of_service_url': 'http://legal.exos.com/terms.html',
                'journey_privacy_policy_url': 'http://legal.exos.com/privacy.html',
                'journey_eula_url': 'http://legal.exos.com/eula.html',
                'google_api_key': 'asdfasdf',
                'facebook_api_key': 'fghdfghjdfgh',
                'google_analytics_key': 'UA-3361528-27',
                'features': [
                    'programs',
                    'rewards',
                    'call_center'
                ],
            },
            'promotions': [{
                'image_url': 'http://placekitten.com/g/500/200',
                'text': 'Fugit iste quis veritatis. Optio, modi. Ducimus sunt, laborum!',
                'order': '1'
            }, {
                'image_url': 'http://placekitten.com/g/500/200',
                'text': 'Quia cum et temporibus. Incidunt in distinctio veniam.',
                'order': '2'
            }, {
                'image_url': 'http://placekitten.com/g/500/200',
                'text': 'Dolores at sit possimus dicta eos explicabo facilis architecto ad enim ab, vel!',
                'order': '3'
            }],
        }
    };

});


function mockHostnameDiscoveryServiceLocation(Service) {

    spyOn(Service, 'getProtocol').andCallFake(function () {
        return mockLocation.protocol;
    });

    spyOn(Service, 'getHostname').andCallFake(function () {
        return mockLocation.hostname;
    });

    spyOn(Service, 'getPort').andCallFake(function () {
        return mockLocation.port;
    });
}