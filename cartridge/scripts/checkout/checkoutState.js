
'use strict';

var baseHelper = module.superModule;
 var Site = require('dw/system/Site');
 var Template = require('dw/util/Template');

function DeclinedEmail(order, locale) {

    var orderObject: Map = new dw.util.HashMap();
    dw.system.Logger.warn("order no.:-"+order.orderNo);
    orderObject.put("Order",order);
     
    var mail: Mail = new dw.net.Mail();
    mail.addTo(order.customerEmail);
    mail.setFrom( Site.current.getCustomPreferenceValue('customerServiceEmail'));
    mail.setSubject("Order Declined");
    
    var template: Template = new dw.util.Template('mail/orderdeclined.isml');

    
    var text: MimeEncodedText = template.render(orderObject);

    mail.setContent(text);
    
  
    mail.send();
}

exports.DeclinedEmail = DeclinedEmail;

