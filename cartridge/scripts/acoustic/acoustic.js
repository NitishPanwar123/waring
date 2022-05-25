'use strict';
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var guard = require('~/cartridge/scripts/guard');
var token = null;

function acoustic_addRecipient(RecipientEmail) {
    GetAccessToken.call();
    addRecipient.call(RecipientEmail);
}

/* Get Access Token */
var GetAccessToken = LocalServiceRegistry.createService('AcousticAuth_us-waringcommercialproducts', {
    createRequest: function (svc, args) {
        // authorization
        var url = svc.getConfiguration().getCredential().getURL();
        var client_id = "0cb8411d-a936-4a2e-bd03-cdee4274a784";
        var client_secret = "b2d966ef-2a1d-4074-9c27-2f0f262afcbb";
        var refresh_token = "rBH432en8LQkBuOuV5XpDUPEqcRyUM1X32QCX2sniZuoS1";

        var body = "?grant_type=" + "refresh_token" +
            "&client_id=" + client_id +
            "&client_secret=" + client_secret +
            "&refresh_token=" + refresh_token +
            "&";

        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.setURL(url + body)
    },
    parseResponse: function (svc, output) {
        var response = JSON.parse(output.text);
        token = response.access_token;
        return output;
    }
});
/*Call Post Method !!*/
var addRecipient = LocalServiceRegistry.createService('AcousticXMLAPI', {
    createRequest: function (svc, args) {
        var url = svc.getConfiguration().getCredential().getURL();
        var xmlData = "<Envelope><Body><AddRecipient>" +
            "<LIST_ID>" + "1434052" + "</LIST_ID>" +
            "<CREATED_FROM>" + 1 + "</CREATED_FROM>" +
            "<CONTACT_LISTS>" +
            "<CONTACT_LIST_ID>" + "1434082" + "</CONTACT_LIST_ID>" +
            "</CONTACT_LISTS>" +
            "<COLUMN><NAME>EMAIL</NAME><VALUE>" + args + "</VALUE></COLUMN>" +
            "<COLUMN><NAME>First_Name</NAME><VALUE>" + args + "</VALUE></COLUMN>" +
            "</AddRecipient></Body></Envelope>";

        svc.setRequestMethod('POST');
        svc.setURL(url);
        svc.addHeader('Authorization', 'Bearer ' + token);
        svc.addHeader('Content-Type', 'text/xml');
        dw.system.Logger.warn('args-:' + xmlData);
        return xmlData;
    },
    parseResponse: function (svc, output) {
        dw.system.Logger.warn('acoustic response' + output.text);
        return output;
    }
});
exports.addRecipient = guard.ensure(['https', 'post'], addRecipient);
exports.GetAccessToken = guard.ensure(['https', 'post'], GetAccessToken);
exports.acoustic_addRecipient = acoustic_addRecipient;