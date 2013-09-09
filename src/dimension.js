/* IIPMooViewer Navigation Widget

   Copyright (c) 2007-2013 Ruven Pillay <ruven@users.sourceforge.net>
   IIPImage: http://iipimage.sourceforge.net

   --------------------------------------------------------------------
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   --------------------------------------------------------------------
*/


var Dimension = new Class({

  Extends: Events,

  options: {},         // Options
  position: {x:0,y:0}, // Position of navigation window
  size: {x:0,y:0},     // Size of navigation window
  scale: 1,

  /* Constructor
   */
  initialize: function( options ){
    //console.log('Dimension');
  },


  /* Create our navigation widget
   */
  create: function( container ){
    this.dimcontainer = new Element( 'div',{
      'class': 'dimcontainer',
      'styles': { /*width: this.size.x*/ }
    });

    // For standalone iphone/ipad the logo gets covered by the status bar
    if( Browser.Platform.ios && window.navigator.standalone ) this.dimcontainer.setStyle( 'top', 20 );

    var toolbar = new Element( 'div', {
      'class': 'toolbar'
    });
    toolbar.inject(this.dimcontainer);

    new Element(
        'div',
        {
          'class': 'iipsrv_measures',
          'html':
            '<select class="iipsrv_choosemeasureunit" style="width: 100%"></select><br />'+
            '<div style="text-align:left; max-height: 150px; overflow: auto;" onmousedown="event.stopPropagation(); return false;">'+
            '<table border="0" cellspacing="0" cellpadding="2" width="100%" class="iipsrv_elencomisure">'+
              '<tr class="iipsrv_quota">'+
                '<td align="center" class="iipsrv_misura_color" width="25"><div style="border-top:3px solid red; width: 20px; height: 1px" /></td>'+
                '<td class="iipsrv_quota_misura"></td>'+
                '<td align="right" width="40"><img src="images/dimScale'+(Browser.buggy?'.png':'.svg')+'" class="iipsrv_scalebtn" />&nbsp;<img src="images/dimAdd'+(Browser.buggy?'.png':'.svg')+'" class="iipsrv_addmeasure" /></td>'+
              '</tr>'+
            '</table>'+
            '</div>'
        }
      )
      .inject(this.dimcontainer);

    this.dimcontainer.getElement('.iipsrv_scalebtn')
      .set('styles', {visibility: 'hidden'})
      .addEvent(
        'click',
        function() {
          var s;
          switch (this.dimcontainer.getElement('select.iipsrv_choosemeasureunit').value) {
            case 'scale':
              s = window.prompt(IIPMooViewerDim.lang.mulprompt, this.scale);
              if (s!==null && !isNaN(s) && parseFloat(s)>0)
                this.scale = parseFloat(s);
              if (s===null)
                return;
              this.dimcontainer.getElement('select.iipsrv_choosemeasureunit').fireEvent('change');
              break;
            case 'custom':
              var quota = this.iipmooviewer._quota;
              s = window.prompt(IIPMooViewerDim.lang.quoteprompt+' ('+(quota.getDistance()*this.iipmooviewer.getScaleFactor()).toFixed(2)+' px):', quota.unit());
              if (s!==null && !isNaN(s) && parseFloat(s)>0)
                quota.unit(parseFloat(s));
              break;
          }
        }.bind(this)
      );

    var _this = this;
    this.dimcontainer.getElement('.iipsrv_addmeasure').addEvent('click', function() { _this.fireEvent('dimnew'); });
    this.dimcontainer.getElement('select.iipsrv_choosemeasureunit').addEvent('change', function(event) { _this.fireEvent('dimsetum', [this.value, _this.scale]); });

    this.dimcontainer.getElement('select.iipsrv_choosemeasureunit')
        .set('html', '<option value="real">'+IIPMooViewerDim.lang.realdim+'</option><option value="scale">'+IIPMooViewerDim.lang.scaledim+'</option><option value="px">'+IIPMooViewerDim.lang.pxdim+'</option><option value="custom">'+IIPMooViewerDim.lang.customdim+'</option>')
        .fireEvent('change');
    // Inject our navigation container into our holding div
    this.dimcontainer.inject(container);

    this.dimcontainer.makeDraggable( {container:container, handle:toolbar} );

  },

  addQuote: function(strumento) {
    new Element(
        'tr',
        {
            'class': 'iipsrv_misura'+strumento.n_strumento,
            'html':
                '<td align="center" class="iipsrv_misura_color" width="25" style="width: 24px; cursor:pointer" title="'+IIPMooViewerDim.lang.circletip+'"><div style="border-width:3px; border-style: solid none none none; border-color:'+strumento.linecolor()+'; width: 20px; height: 1px" /></td>'+
                '<td class="iipsrv_misura_misura"></td>'+
                '<td align="right"><img src="images/dimDel'+(Browser.buggy?'.png':'.svg')+'" class="iipsrv_delmeasure" /></td>'
        }
    ).inject(this.dimcontainer.getElement('.iipsrv_elencomisure'));

    var _this = this;
    var f1 = function(event) {
      var element = this.getElement('div'),
          tr = this.getParent('tr'),
          css = (tr.getAttribute('class') || '').split(' '),
          n = -1,
          c = false;
      for (var i=0; i<css.length; i++) {
        if (css[i].indexOf('iipsrv_misura')===0) {
          n = parseInt(css[i].substr(13), 10);
          break;
        }
      }
      _this.fireEvent('dimtogglecircle', n);
    };
    this.dimcontainer.getElement('.iipsrv_misura'+strumento.n_strumento+' .iipsrv_misura_color').addEvent('click', f1);


    var f2 = function() {
      var tr = this.getParent('tr'),
          css = (tr.getAttribute('class') || '').split(' '),
          n = -1;
      for (var i=0; i<css.length; i++) {
        if (css[i].indexOf('iipsrv_misura')===0) {
          n = parseInt(css[i].substr(13), 10);
          break;
        }
      }
      if (n>=0)
        _this.fireEvent('dimdel', n);
    };
    this.dimcontainer.getElement('.iipsrv_misura'+strumento.n_strumento+' .iipsrv_delmeasure').addEvent('click', f2);
  },

  removeQuote: function(index) {
    this.dimcontainer.getElement('.iipsrv_misura'+index).dispose();
  },

  toggleCircle: function(index, state) {
    var styles;
    if (state)
      styles = { width: '10px', height: '10px', 'border-style': 'solid', '-moz-border-radius': '10px', '-webkit-border-radius': '10px', 'border-radius': '10px' };
    else
      styles = { width: '20px', height: '1px', 'border-style': 'solid none none none', '-moz-border-radius': '0px', '-webkit-border-radius': '0px', 'border-radius': '10px' };
    this.dimcontainer.getElement('.iipsrv_misura'+index+' .iipsrv_misura_color div').set('styles', styles);
  },

  setQuoteValue: function(value) {
    this.dimcontainer.getElement('select.iipsrv_choosemeasureunit').value = value;
    switch (value) {
      case 'custom':
      case 'scale':
        this.dimcontainer.getElement('.iipsrv_scalebtn').set('styles', {visibility: 'inherit'});
        break;
      default:
        this.dimcontainer.getElement('.iipsrv_scalebtn').set('styles', {visibility: 'hidden'});
    }
  },
  setQuoteLabel: function(value) {
    this.dimcontainer.getElement('.iipsrv_quota_misura').set('html', value);
  },
  setDimLabel: function(index, value) {
    this.dimcontainer.getElement('.iipsrv_misura'+index+' td.iipsrv_misura_misura').set('html', value);
  },

  show: function(animate) {
    if (animate)
      this.dimcontainer.show().fade('in');
    else
      this.dimcontainer.show();
  },
  hide: function(animate) {
    if (animate)
      this.dimcontainer.show().set('onComplete', function() { this.hide(); }).fade('out');
    else
      this.dimcontainer.hide();
  },

  /* Toggle the visibility of our navigation window
   */
  toggleWindow: function(){
    // For removing the navigation window if it exists - must use the get('reveal')
    // otherwise we do not have the Mootools extended object
    if( this.dimcontainer ){
      this.dimcontainer.get('reveal').toggle();
    }
  },


  /* Reflow our navigation window
   */
  reflow: function( container ){
    // Resize our navigation window
    container.getElements('div.dimcontainer, div.dimcontainer div.loadBarContainer').setStyle('width', this.size.x);
  }

});
