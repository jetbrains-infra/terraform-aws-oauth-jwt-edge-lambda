const {handler} = require('./lambda')

const token = "PUT YOUR TOKEN HERE";

const exampleEvent = {
    "Records": [
        {
            "cf": {
                "config": {
                    "distributionId": "EDFDVBD6EXAMPLE"
                },
                "request": {
                    "clientIp": "2001:0db8:85a3:0:0:8a2e:0370:7334",
                    "method": "GET",
                    "uri": "/picture.jpg",
                    "headers": {"authorization" : [
                            {
                                "value": "Bearer " + token,
                            }],
                        "host": [
                            {
                                "key": "Host",
                                "value": "d111111abcdef8.cloudfront.net"
                            }
                        ],
                        "user-agent": [
                            {
                                "key": "User-Agent",
                                "value": "curl/7.51.0"
                            }
                        ]
                    }
                }
            }
        }
    ]
}

Object.freeze(exampleEvent)

handler(exampleEvent, {this_is_mock_context: true}).then(console.log, console.log);
