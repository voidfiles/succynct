console.log('views/contextmenu.js');

/**
 * Handle interactions with the Chrome omnibox
 */
window.ContextMenu = Backbone.View.extend({


  initialize: function() {
    _.bindAll(this);
  },
  // events: { },


  /**
   * Gets called when the user selects menu item from the context menu
   */
  onClick: function(info, tab) {
    console.log(info, tab);
    chrome.windows.get(tab.windowId, {}, function (current_window) {
        var width = current_window.width;
        var height = current_window.height;
        var top = current_window.top;
        var left = current_window.left;
        var pop_up_width = 500;
        var pop_up_height = 246;

        var pop_up_left = (width + left) - (pop_up_width + 100);
        var pop_up_top = top + 100;
        var url = chrome.extension.getURL('/share_on_adn.html');
        var title = tab.title;
        var link = info.pageUrl;
        var image_url;
        if (info.mediaType === 'image') {
          image_url = info.srcUrl;
        }
        url = url + '?title=' + encodeURIComponent(title);
        url = url + '&url=' + encodeURIComponent(link);
        if (image_url) {
          url = url + '&image_url=' + encodeURIComponent(image_url);
        }
        chrome.windows.create({
            url: url,
            type: 'popup',
            focused: true,
            width: pop_up_width,
            height: pop_up_height,
            left: pop_up_left,
            top: pop_up_top
          });
    });

  }

});


contextmenu = new ContextMenu();
