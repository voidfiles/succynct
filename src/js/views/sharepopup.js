console.log('views/sharepopup.js');

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
};

var parse = function(markdown) {
  // Markdown bracket regex based on http://stackoverflow.com/a/9268827
  var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/;

  // Regex pulled from https://github.com/chriso/node-validator and country codes pulled from http://data.iana.org/TLD/tlds-alpha-by-domain.txt
  var bareUrlRegex = /((?:http|https|ftp|scp|sftp):\/\/)?(?:\w+:\w+@)?(?:localhost|(?:(?:[\-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|AC|AD|AE|AF|AG|AI|AL|AM|AN|AO|AQ|AR|AS|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BJ|BM|BN|BO|BR|BS|BT|BV|BW|BY|BZ|CA|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|CR|CU|CV|CW|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EE|EG|ER|ES|ET|EU|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|IO|IQ|IR|IS|IT|JE|JM|JO|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MG|MH|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NC|NE|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|ST|SU|SV|SX|SY|SZ|TC|TD|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TP|TR|TT|TV|TW|TZ|UA|UG|UK|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|YE|YT|ZA|ZM|ZW))|(?:(?:\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(?:\.(?:\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[\-\w~!$+|.,="'\(\)_\*:]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[\-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[\-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[\-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[\-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[\-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?/ig;

  var links = [];
  var text = markdown;

  function handleReplacement(_, anchor, url, pos) {
    links.push({
      pos: pos,
      len: anchor.length,
      url: url
    });

    return anchor;
  }

  var oldText;

  // Has to be called repeatedly, since if done globally, it will provide the original index (before earlier replacements)
  do {
    oldText = text;
    text = oldText.replace(markdownLinkRegex, handleReplacement);
  } while(text !== oldText);

  return {
    text: text,
    entities: {
      links: links
    }
  };
};

/**
 * Handle the UI for options.html
 */
var SharePopupView = Backbone.View.extend({
  events: {
    "submit form": "post"
  },

  initialize: function() {
    console.log('views/sharepopup.js:initialize');
    _.bindAll(this);
    var title = getQueryVariable('title');
    var url = getQueryVariable('url');
    var image_url = getQueryVariable('image_url');
    var initial_text = '[' + title + '](' + url + ')';
    $('textarea').text(initial_text);
    if (image_url) {
      $('<img/>').attr('src', image_url).appendTo('body').css({
        'visibility':'hidden',
        'position': 'absolute',
        'z-index': 0,
        'top': 0
      });
    }
  },


  /**
   * Start rendering both options and accounts
   */
  post: function() {
    var text = $('textarea').val();
    var post = new Post();
    var post_ob = parse(text);
    var image_url = getQueryVariable('image_url');
    if (image_url) {
      post_ob.annotations = post_ob.annotations || [];
      post_ob.annotations.push({
        type: "net.app.core.oembed",
        value: {
          type: 'photo',
          version: '1.0',
          title: getQueryVariable('title'),
          url: image_url,
          width: $('img').width(),
          height: $('img').height(),
          thumbnail_url: image_url,
          thumbnail_width: $('img').width(),
          thumbnail_height: $('img').height()
        }
      });
    }
    post.save(post_ob, {
      headers: {
        'Authorization': 'Bearer ' + accounts.at(0).get('access_token'),
        // HACK: should be applied globally
        'X-ADN-Migration-Overrides': 'response_envelope=1&disable_min_max_id=1&follow_pagination=1&pagination_ids=1'
      },
      success: function (model, textStatus, jqXHR) {
        post.success(model, textStatus, jqXHR);
        window.close();
      },
      error: post.error
    });

    return false;
  }

});
