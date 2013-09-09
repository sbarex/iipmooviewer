var IIPMooViewerDim = new Class({
    Extends: IIPMooViewer,
    version: '1.0.0',

    initialize: function(main_id, options) {
        this._misura = false;
        this._paper  = null;
        this._quota  = null;
        this._strumenti = [ ];
        this._last_n_strumenti = 0;
        this._current_um = '?';
        this._current_measure_track = null;
        this._dpi_scale = 1; // fattore di scala alle misure quando si usano i dpi

        this.parent(main_id, options);
        this.measureVisible = typeof(options.measureExpanded)==='undefined' ? true : options.measureExpanded;

        this.dimension = null;
        if( (typeof(Dimension)==="function") ){
            this.dimension = new Dimension({ });
            this.dimension.iipmooviewer = this;
        }
    },

    createWindows: function(){
        this.parent();
        if (!this.scale) return;

        new Element(
                'img',
                {
                    'class': 'iipsrv_ruler',
                    src: 'images/dim'+(Browser.buggy?'.png':'.svg'),
                    title: IIPMooViewerDim.lang.dimicontip
                }
            )
            .addEvent('click', this._showMeasureTools.bind(this))
            .inject(this.navigation.navcontainer.getElement('.navbuttons'));

        var _this = this;
        if (this.dimension) {
            this.dimension.create(this.container);
            this.dimension.addEvents({
                'dimsetum': function(um, scale) {
                    _this.unit(um, scale);
                },
                'dimnew': function(event) {
                    var area = _this.getVisibleArea(false);
                    _this.addMeasureTool(area.x+area.w/4, area.y+area.h/2, area.x+area.w*3/4, area.y+area.h/2, false);
                },
                'dimdel': function(index) {
                    _this.removeMeasureTool(index);
                },
                'dimtogglecircle': function(index) {
                    for (var j=0; j<_this._strumenti.length; j++) {
                        if (_this._strumenti[j].n_strumento==index) {
                            var c = !_this._strumenti[j].circleVisible();
                            _this._strumenti[j].circleVisible(c);
                            _this.dimension.toggleCircle(index, c);
                            break;
                        }
                    }
                }
            });
        }
        this.createMeasureTools();
        new Element('li', {
            'html': IIPMooViewerDim.lang.guide
        }).inject(this.container.getElement('div.info ul'));

        this.showMeasureTools(this.measureVisible, false);
    },

    /** Imposta il tipo di unità di misura da usare */
    unit: function(um, scale) {
        if (typeof um=='undefined')
            return this._current_um;
        else {
            if (typeof scale==='undefined')
                scale = this._dpi_scale;
            else
                this._dpi_scale = scale;
            this._current_um = um;
            var u = false;
            //debugger;
            this.dimension.setQuoteValue(um);
            switch(this._current_um) {
                case 'px':
                    u = 1;
                    this.dimension.setQuoteLabel('<i>1px</i> = <i>1px</i>');
                    if (this._quota) this._quota.hide();
                    break;
                case 'scale':
                    // ;
                    //if (this._dpi_scale==1) scale_lst.val('dpi');
                    u = (this.scale.pixelscale*10) / this._dpi_scale;
                    if (this._quota) this._quota.hide();
                    this.dimension.setQuoteLabel('<i>'+u.toFixed(2)+'px</i> = <i>1cm</i> (1:'+this._dpi_scale+')');
                    break;
                default:
                case 'real':
                    if (this._quota) this._quota.hide();
                    u = this.scale.pixelscale;
                    this.dimension.setQuoteLabel('<i>'+this.scale.pixelscale+'px</i> = <i>1mm</i>');
                    break;
                case 'custom':
                    u = false;
                    if (this._quota) {
                        this._quota.show();
                        this.dimension.setQuoteLabel('<i>'+(this._quota.getDistance()*this.getScaleFactor()).toFixed(0)+'px</i> = <i>'+this._quota.unit()+'um</i>');
                    } else {
                        this.dimension.setQuoteLabel('<i>?</i>');
                    }
                    break;
            }

            this.fireEvent('unitchanged', this._current_um);

            for (var i=0; i<this._strumenti.length; i++) {
                if (u) {
                    this._strumenti[i].quote(null);
                    this._strumenti[i].unit(u);
                } else {
                    this._strumenti[i].quote(this._quota);
                }
            }
        }
    },

    createMeasureTools: function() {
        if (typeof Raphael == 'undefined')
            throw('IIPMooViewerDim: SVG Raphael library not found!');
        if (typeof Quote == 'undefined')
            throw('IIPMooViewerDim: Quote Class not found!');

        var size = this.canvas.getSize();
        this.misura = new Element('div#iipsrv_measuretools', {
            'class': 'iipsrv_measuretools',
            'styles': {
                position: 'absolute',
                'z-index': 100,
                background: 'rgba(0,0,0, 0.015)', // su ie gli eventi del mouse vengono gestiti solo se è impostato un background
                'user-select': 'none',
                '-ms-user-select': 'none',
                '-moz-user-select': 'none',
                '-webkit-user-select': 'none',
                width: size.x,
                height: size.y
            }
        });
        this.misura.inject(this.canvas);
        this.misura.addEvent('mousedown', this.rulerMouseDown.bind(this));
        this.misura.store('res', this.view.res);

        this._paper = new Raphael(this.misura);

        this._quota = new Quote(this._paper);
        this._quota.setP1P2(50, 100, 150, 100);
        this._quota.linecolor('red');
        this._quota.textcolor('green');
        this._quota.bgcolor('yellow');
        this._quota.registerListner(this._handleMisuraChanged.bind(this));
        this._quota.name="quota";

        this._strumenti = [];
        this._last_n_strumenti = 0;

        this._quota.unit(this._quota.getDistance());
        this.addMeasureTool(0.25, 0.5, 0.75, 0.5, false);
        this._updateMisuraDimensions(true);

        this.unit('real', 1);
    },

    _showMeasureTools: function(event) { this.showMeasureTools(); },

    isMeasureToolsVisible: function() { return this.misura.getStyle('display') !== 'none'; },

    /** Mostra/Nasconde gli strumenti di misura */
    showMeasureTools: function(state, animate) {
        if (typeof state=='undefined') state = !this.isMeasureToolsVisible();
        if (typeof animate=='undefined') animate = true;
        this.measureVisible = state;
        if (!this.misura) return;
        if (state) {
            this.misura.show();
            this.touch.detach();
            this.dimension.show(animate);
            if (!animate)
                this.scale.scale.hide();
            else
                this.scale.scale.set('onComplete', function() { this.hide(); }).fade('out');
        } else {
            this.misura.hide();
            this.touch.attach();
            this.dimension.hide(animate);
            if (!animate)
                this.scale.scale.show();
            else
                this.scale.scale.show().fade('in');
        }
    },

    zoomTo: function(r) {
        this.parent(r);
        this._updateMisuraDimensions();
    },

    reload: function(){
        this.parent();
        this._updateMisuraDimensions();
    },

    _updateMisuraDimensions: function(force) {
        if (typeof force==='undefined') force = false;
        var size = this.canvas.getSize();
        this.misura.setStyles({
            width: size.x,
            height: size.y
        });
        this._paper.setSize(size.x, size.y);
        var old_z = this.misura.retrieve('res'),
            new_z = this.view.res;
        if (force || new_z!=old_z) {
            var x1, y1, x2, y2,
                old_scale = this.getScaleFactor(old_z),
                new_scale = this.getScaleFactor(new_z);
            // ricolloca le misure
            for (var i=0, c=this._strumenti.length; i<c; i++) {
                // riconduce le coordinate alla nuova scala
                x1 = this._strumenti[i].getP1x()*old_scale/new_scale;
                y1 = this._strumenti[i].getP1y()*old_scale/new_scale;
                x2 = this._strumenti[i].getP2x()*old_scale/new_scale;
                y2 = this._strumenti[i].getP2y()*old_scale/new_scale;
                this._strumenti[i].setP1P2(x1, y1, x2, y2, false, false);
                this._strumenti[i].scale(1/new_scale);
            }
            x1 = this._quota.getP1x()*old_scale/new_scale;
            y1 = this._quota.getP1y()*old_scale/new_scale;
            x2 = this._quota.getP2x()*old_scale/new_scale;
            y2 = this._quota.getP2y()*old_scale/new_scale;
            this._quota.setP1P2(x1, y1, x2, y2, false);
            this._quota.scale(1/new_scale);
        }
        this.misura.store('res', this.view.res);
    },

    /* Transform resolution independent coordinates to coordinate system
     */
    transformCoords: function( x, y ){
        if (!this.isMeasureToolsVisible())
            return this.parent(x, y);

        var real_x = x*this.max_size.w,
            real_y = y*this.max_size.h,
            text;

        switch(this._current_um) {
            case 'px':
                text = Math.round(real_x)+'px, '+Math.round(real_y)+'px';
                break;
            case 'scale':
                // ;
                //if (this._dpi_scale==1) scale_lst.val('dpi');
                text = Math.round(real_x/(this.scale.pixelscale/this._dpi_scale))+'mm, '+Math.round(real_y/(this.scale.pixelscale/this._dpi_scale))+'mm';
                break;
            default:
            case 'real':
                text = Math.round(real_x/this.scale.pixelscale)+'mm, '+Math.round(real_y/this.scale.pixelscale)+'mm';
                break;
            case 'custom':
                var u = this._quota.unit(),
                    d = this._quota.getDistance()*this.getScaleFactor();
                text = Math.round((real_x/d)*u)+'um, '+Math.round((real_y/d)*u)+'um';
                break;
        }
        return text;
    },

    convertRelativeCoords: function(coords, currentScale) {
        var r = {x: 0, y: 0};
        r.x = coords.x*this.max_size.w;
        r.y = coords.y*this.max_size.h;
        if (currentScale) {
            var scale = this.getScaleFactor();
            r.x /= scale;
            r.y /= scale;
        }
        return r;
    },

    /** Restituisce il fattore moltiplicativo da applicare alle misure dell'immagine per ottenere quelle dell'alta risoluzione
      * @param res indice della risoluzione da valutare (0 è la minore), se non specificato usa la risolzione attuale*/
    getScaleFactor: function(res) {
        if (typeof res=='undefined') res = this.view.res;
        return Math.pow(2, this.num_resolutions-res-1);
    },

    /**
     * Restituisce le coordinate di immagine attualmente visibile.
     * @param  bool absolute true: resitutisce coordinate assolute in px relative alla massima risoluzione, false: restituisce coordinate relative in percentuale.
     */
    getVisibleArea: function(absolute) {
        var view = this.getView();
        var r = {
            x: view.x/this.wid*(absolute ? this.max_size.w : 1),
            y: view.y/this.hei*(absolute ? this.max_size.h : 1),
            w: Math.min(1, view.w/this.wid)*(absolute ? this.max_size.w : 1),
            h: Math.min(1, view.h/this.hei)*(absolute ? this.max_size.h : 1)
        };
        return r;
    },

    /**
     * Aggiunge un nuovo strumento di misura
     * @param  float x1      [description]
     * @param  float y1      [description]
     * @param  float x2      [description]
     * @param  float y2      [description]
     * @param  bool absolute Se true indica coordinate in px relative alla massima risoluzione, se false coordinate relative in percentuale.
     * @param  string color  [description]
     * @return int           Restituisce l'indice della misura aggiunta
     */
    addMeasureTool: function(x1, y1, x2, y2, absolute, color) {
        if (!this.scale)
            return;
        var A0 = {x: x1, y: y1},
            B0 = {x: x2, y: y2},
            A, B;
        if (absolute) {
            var scale = this.getScaleFactor();
            A = {x: A0.x/scale, y: A0.y/scale};
            B = {x: B0.x/scale, y: B0.y/scale};
        } else {
            A = this.convertRelativeCoords(A0, true),
            B = this.convertRelativeCoords(B0, true);
        }
        if (typeof color=='undefined') {
            switch (this._strumenti.length) {
                case 0:  color='#6666ff'; break;
                case 1:  color='#B2409C'; break;
                case 2:  color='#883A31'; break;
                case 3:  color='#B28440'; break;
                case 4:  color='#B4C652'; break;
                default: color='#52C675'; break;
            }
        }
        var strumento = new Misura(this._paper);
        strumento.circleVisible(false);
        strumento.setP1P2(A.x, A.y, B.x, B.y);
        strumento.linecolor(color);
        strumento.scale(1/this.getScaleFactor());
        switch (this._current_um) {
            case 'px': strumento.unit(1); break;
            case 'scale': strumento.unit(this.scale.pixelscale / this._dpi_scale); break;
            default:
            case 'real': strumento.unit(this.scale.pixelscale); break;
            case 'custom': strumento.quote(this._quota); break;
        }
        strumento.registerListner(this._handleMisuraChanged.bind(this));
        strumento.n_strumento = this._last_n_strumenti++;
        strumento.name = "dim"+strumento.n_strumento;
        this._strumenti.push(strumento);

        this.dimension.addQuote(strumento);

        strumento._callListners(true);
        this.misura.set('styles', { cursor: this._strumenti.length<=1 ? 'crosshair' : 'default'});
        return strumento.n_strumento;
    },

    removeMeasureTool: function(index) {
        var n=-1;
        for (var i=0; i<this._strumenti.length; i++) {
            if (this._strumenti[i].n_strumento==index) {
                n = i;
                break;
            }
        }
        if (n<0) throw('Measure index out of range!');
        // /* DEBUG */ console.log('IIPExplorerMeasure: remove measure '+n+' ('+index+')');
        this._strumenti[n].remove();
        this._strumenti.splice(n, 1);

        this.dimension.removeQuote(index);

        this.misura.set('styles', {'cursor': this._strumenti.length<=1 ? 'crosshair' : 'default'});
    },

    _handleMisuraChanged: function(misura, distanza, angle, unit, scale) {
        var d;
        if (misura==this._quota) {
            if (this.unit()=='custom') {
                d = distanza/scale;
                var u = unit,
                    mcd = gcd(d, u); // massimo comun divisore per semplificare i valori
                this.dimension.setQuoteLabel('<i>'+(d/mcd).toFixed(0)+'px</i> = <i>'+(unit/mcd)+'um</i>');
                this.fireEvent('quotechanged', misura);
            }
        } else {
            d = distanza/unit/scale;
            this.dimension.setDimLabel(misura.n_strumento, IIPMooViewerDim.lang.distlabel+': '+d.toFixed(2)+'<br />'+IIPMooViewerDim.lang.anglelabel+': '+(angle*180/Math.PI).toFixed(2)+'°');
            this.fireEvent('measurechanged', misura);
        }
    },


    rulerMouseDown: function(event) {
        e = eventOffsetFix(event, this.misura);

        if (e.metaKey || e.ctrlKey)
            this._current_measure_track = this._quota.visible() ? this._quota : false;
        else if (this._strumenti.length===0) {
            this.addMeasureTool(e.offsetX/this.wid, e.offsetY/this.hei, e.offsetX/this.wid, e.offsetY/this.hei, false);
            this._current_measure_track = this._strumenti[0];
        } else if (this._strumenti.length==1)
            this._current_measure_track = this._strumenti[0];
        else
            this._current_measure_track = false; // non traccia una misura se ce ne sono più di una
        if (!this._current_measure_track)
            return;

        this._current_measure_track.setP1P2(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
        //console.log('start: ', e.offsetX, e.offsetY);
        // attiva i gestore degli eventi
        this.mousemoveRuler = this.rulerMouseMove.bind(this);
        this.mouseupRuler = this.rulerMouseUp.bind(this);
        this.misura.addEvents({
            mousemove: this.mousemoveRuler,
            mouseup: this.mouseupRuler
        });
        e.preventDefault();
    },

    rulerMouseUp: function(event) {
        this.rulerMouseMove(event);

        // rilascia il gestore degli eventi
        this.misura.removeEvents({
            mousemove: this.mousemoveRuler,
            mouseup: this.mouseupRuler
        });
        this._current_measure_track = null;
    },

    rulerMouseMove: function(event) {
        if (!this._current_measure_track) {
            if (console && console.error) console.error('Error in _current_measure_track');
            return;
        }
        e = eventOffsetFix(event, this.misura);
        if (e.shift)
            this._current_measure_track.setP1P2(this._current_measure_track.getP1x(), this._current_measure_track.getP1y(), e.offsetX, e.offsetY, true);
        else
            this._current_measure_track.setP2(e.offsetX, e.offsetY);
    },

    key: function(e) {
        var event = new DOMEvent(e);
        switch (e.code) {
            case 68: // d
                this.showMeasureTools();
                event.preventDefault(); // Prevent default only for navigational keys
                break;
            default:
                this.parent(e);
                break;
        }
    }
});

/** Calcola il massimo comun divisore con l'algoritmo di Euclide */
function gcd(a,b) {
    if (Math.floor(a)!=a || Math.floor(b)!=b) return 1; // se i numeri non sono interi restituisce 1
    a = Math.abs(a); b = Math.abs(b);
    if (b > a)
        b = (a += b -= a) - b; // scambia le variabili in modo che b<a
    while (b !== 0) {
        var m = a % b;
        a = b;
        b = m;
    }
    return a;
}

function eventOffsetFix(e, target) {
    if (typeof e.event!=='undefined' && typeof e.event.offsetX !== "undefined" || typeof e.event.offsetY !== "undefined") {
        e.offsetX = e.event.offsetX;
        e.offsetY = e.event.offsetY;
    }
    if (typeof e.offsetX === "undefined" || typeof e.offsetY === "undefined") {
        // firefox non implementa offsetX e offsetY
        if (typeof target=='undefined') target = e.target;
        var targetOffset = target.getOffsets();
        e.offsetX = Math.round(e.page.x - targetOffset.x);
        e.offsetY = Math.round(e.page.y - targetOffset.y);
        //if (log) console.log('e.offset ', e.offsetX, e.offsetY, targetOffset, e.target);
    }
    return e;
}
