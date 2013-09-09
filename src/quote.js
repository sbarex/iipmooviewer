/** Strumento per definire delle misure di riferimento */
var Quote = new Class({
    Extends: Events,
    version: '1.0.0',

    ARROW_LENGTH: 8, // length of the arrow head
    ARROW_ANGLE: Math.PI/4, // half angle of arrow head

    // colori
    _linecolor: '#66f',
    _textcolor: '#000',
    _bgcolor  : '#fff',
    _linea2   : {},
    _linea    : {},
    _label    : {},
    _hotspot1 : {},
    _hotspot2 : {},
    _set      : {},

    // impostazioni
    _unit     : 1, // fattore moltiplicativo della distanza
    _scale    : 1, // fattore di scala
    // coords
    _p1       : { x: 0, y: 0 }, // first point
    _p2       : { x: 0, y: 0 }, // second point
    //
    _listners : [ ],

    initialize: function(paper) {
        var handleHotMouseDown = function(e) {
            e.stopImmediatePropagation();
        };

        this._linea2 =
            paper.path('')
                .attr(
                    {
                        stroke: this.bgcolor(),
                        'stroke-width': 3,
                        'stroke-opacity': 0.5,
                        fill: this.bgcolor(),
                        'opacity': 0.5
                    }
                );
        this._linea =
            paper.path('')
                .attr(
                    {
                        stroke: this.linecolor(),
                        'stroke-width': 1
                    }
                );
        this._label = paper.text(0, 0, '')
            .attr(
                {
                    'text-decoration': 'none',
                    fill: this.textcolor(),
                    cursor: 'move'
                }
            )
            .drag(this._drag_move, this._drag_start, this._drag_end)
            .mousedown(handleHotMouseDown);
        this._hotspot1 =
            paper.circle(0, 0, 10)
                .attr(
                    {
                        fill: '#fff',
                        'fill-opacity': 0,
                        'stroke-width': 0,
                        'stroke-opacity': 0,
                        cursor: 'crosshair',
                        title: IIPMooViewerDim.lang.drag_tip
                    }
                )
                .drag(this._drag_move, this._drag_start, this._drag_end)
                .mousedown(handleHotMouseDown);
        this._hotspot2 =
            paper.circle(0, 0, 10)
                .attr(
                    {
                        fill: '#fff',
                        'fill-opacity': 0,
                        'stroke-width': 0,
                        'stroke-opacity': 0,
                        cursor: 'crosshair',
                        title: IIPMooViewerDim.lang.drag_tip
                    }
                )
                .drag(this._drag_move, this._drag_start, this._drag_end)
                .mousedown(handleHotMouseDown);

        this._linea2.strumento = this;
        this._linea.strumento = this;
        this._label.strumento = this;
        this._hotspot1.strumento = this;
        this._hotspot2.strumento = this;

        this._set = paper.set();
        this._set.push(
            this._linea2,
            this._linea,
            this._label,
            this._hotspot1,
            this._hotspot2
        );

        this._label
            .attr('font-weight', 'bold')
            .dblclick(this._labeldblclick);

        this._unit = 1;
        this._scale = 1;
    },

    remove: function() {
        this._set.remove();
        this.clearListners();
        this.quote(null);
    },

    /**
     * Gestisce il doppioclick sull'etichetta
     * @param  DOMEvent e
     * @return void
     */
    _labeldblclick: function(e) { // {{{
        e.stopImmediatePropagation();
        var s = this.strumento.scale();
        var d = this.strumento.getDistance()/s;
        var u = window.prompt(IIPMooViewerDim.lang.set_unit+' ('+d.toFixed(2)+'px):', this.strumento.unit());
        if (u === null)
            return;
        else if (isNaN(u) || u<=0)
            alert(IIPMooViewerDim.lang.invalid_unit);
        else {
            this.strumento.unit(parseFloat(u));
            this.strumento._callListners();
        }
    },

    /**
     * Invocata quando si sta iniziando a trascindare un elemento
     * @return void
     */
    _drag_start: function() {
        // NOTARE CHE THIS PUNTA ALL'OGGETTO RAPHAHEL CHE GENERA L'EVENTO!
        if (!this.strumento) return;
        //console.log('drag start', this, this.strumento, this.strumento._hotspot1, this==this.strumento._hotspot1);
        if (this==this.strumento._hotspot1 || this==this.strumento._hotspot2) {
            this.ox = this.attr("cx");
            this.oy = this.attr("cy");
        } else if (this==this.strumento._linea2 || this==this.strumento._label) {
            this.ax = this.strumento._p1.x; this.ay = this.strumento._p1.y;
            this.bx = this.strumento._p2.x; this.by = this.strumento._p2.y;
        } else {
            // if (console && console.warn) console.warn('NO drag start', this, this.strumento);
        }
    },
    _drag_end: function() {
        // `this` is the Rapahel object that fire the event!
        // console.log('end drag', this);
    },
    _drag_move: function(dx, dy) {
        //console.log('_drag_move');
        // `this` is the Rapahel object that fire the event!
        if (!this.strumento)
            return;
        else if (this==this.strumento._hotspot1)
            this.strumento.setP1(Math.max(0, Math.min(this.paper.width, this.ox+dx)), Math.max(0, Math.min(this.paper.height, this.oy+dy)));
        else if (this==this.strumento._hotspot2)
            this.strumento.setP2(Math.max(0, Math.min(this.paper.width, this.ox+dx)), Math.max(0, Math.min(this.paper.height, this.oy+dy)));
        else if (this==this.strumento._linea2 || this==this.strumento._label) {
            // impedisce di trascinare la quota fuori dal paper
            var x1 = this.ax + dx,
                y1 = this.ay + dy,
                x2 = this.bx + dx,
                y2 = this.by + dy;
            var xleft   = Math.min(x1, x2),
                xright  = Math.max(x1, x2),
                ytop    = Math.min(y1, y2),
                ybottom = Math.max(y1, y2);
            if (xleft<0) dx -= xleft;
            if (ytop<0)  dy -= ytop;
            if (xright>this.paper.width)   dx += this.paper.width-xright;
            if (ybottom>this.paper.height) dy += this.paper.height-ybottom;

            this.strumento.setP1P2(this.ax + dx, this.ay + dy, this.bx + dx, this.by + dy);
        } else
            return;
    },

    visible: function(v) {
        if (typeof v=='undefined')
            return this._set.items[0].node.style.display != "none";
        else if (v)
            this._set.show();
        else
            this._set.hide();
    },

    show: function() { this.visible(true); },
    hide: function() { this.visible(false); },

    linecolor: function(c) { // {{{
        if (typeof c === 'undefined')
            return this._linecolor;
        else {
            this._linecolor = c;
            if (this._linea && this._linea.attr)
                this._linea.attr("stroke", this._linecolor);
        }
    },

    bgcolor: function(c) {
        if (typeof c === 'undefined')
            return this._bgcolor;
        else {
            this._bgcolor = c;
            if (this._linea && this._linea.attr)
                this._linea2.attr(
                    {
                        stroke: this._bgcolor,
                        fill: this._bgcolor
                    }
                );
        }
    },

    textcolor: function(c) {
        if (typeof c === 'undefined')
            return this._textcolor;
        else {
            this._textcolor = c;
            this._label.attr('fill', this._textcolor);
        }
    },

    /** Set the unit (number of units in the dim length). */
    unit: function(v) {
        if (typeof v === 'undefined')
            return this._unit;
        else {
            //if (this instanceof Misura)
            //  console.log('new unit: ', v, this);
            //else
            //  console.log('new unit: ', v+'/'+this.getDistance(), this);
            this._unit = v;
            this.draw();
            this._callListners();
        }
    },

    scale: function(v) {
        if (typeof v === 'undefined')
            return this._scale;
        else {
            this._scale = v;
            this.draw();
            this._callListners();
        }
    },

    getDistance: function() {
        return Math.sqrt((this._p2.x-this._p1.x)*(this._p2.x-this._p1.x)+(this._p2.y-this._p1.y)*(this._p2.y-this._p1.y)); // px
    },


    /** Angle in radiant
      * @param normalize: [default true] If True return a value from 0 to 2PI, else return a valure from -PI/2 and +PI/2
      **/
    getAngle: function(normalize) {
        if (typeof normalize==='undefined') normalize = true;
        try {
            var m = (this._p2.y-this._p1.y)/(this._p2.x-this._p1.x);
            if (isNaN(m))
                if (normalize && this._p1.x==this._p2.x && this._p1.y==this._p2.y)
                    return this._p2.y<this._p1.y ? 0 : Math.PI/2;
                else
                    return 0;
            var a = Math.atan(m); // arctan, return 0<valure<PI/2 (90°)
            if (normalize) {
                a = Math.abs(a);
                if (this._p2.y<=this._p1.y && this._p2.x<this._p1.x)
                    a = Math.PI-a;
                else if (this._p2.y>this._p1.y && this._p2.x<=this._p1.x)
                    a = Math.PI + a;
                else if (this._p2.y>this._p1.y && this._p2.x>this._p1.x)
                    a = 2*Math.PI - a;
            }
            return a;
        } catch (e) {
            return 0;
        }
    },

    /** Label for the dim */
    getLabel: function() {
        return (this._unit).toFixed(2)+' um';
    },

    draw: function() {
        var d = this.getDistance(); // distance
        if (d===0) {
            this._linea.attr('path','');
            this._linea2.attr('path','');
            this._label.attr('text','');
            return;
        }
        this._label.attr('text', this.getLabel()); // update the label

        var box = this._label.getBBox(true),
            box_w = box.width+10, // space for the label
            box_h = box.height+5;
        var alpha = this.getAngle(), // angle in radiants
            alpha1 = this.getAngle(false), // angolo in radianti della retta
            a = alpha * 180/Math.PI, // angle in radiants
            m = (this._p2.y-this._p1.y)/(this._p2.x-this._p1.x), // coefficiente angolare della linea
            q = (this._p1.y*this._p1.x-this._p2.y*this._p1.x)/(this._p2.x-this._p1.x)+this._p1.y; // intercetta

        if (a<90 || a>270) a+= 180; // rotate the label for best readability

        // find the center of the label
        var label_x, label_y;
        if (box_w>d) {
            // no space for draw the label inside the dim, draw the label outside
            if (Math.abs(alpha1)==Math.PI/2) {
                // vertical line
                label_x = this._p2.x;
                label_y = this._p2.y - box_w/2 * (this._p2.y<this._p1.y ? 1 : -1);
            } else {
                label_x = this._p2.x + Math.cos(alpha1)*box_w/2 * (this._p2.x>this._p1.x ? 1 : -1);
                label_y = this._p2.y + Math.sin(alpha1)*box_w/2 * (this._p2.x>this._p1.x ? 1 : -1);
            }
        } else {
            // draw the label inside the dim
            label_x = this._p1.x+(this._p2.x-this._p1.x)/2;
            label_y = this._p1.y+(this._p2.y-this._p1.y)/2;
        }
        // set the label
        this._label.transform('T'+label_x+','+label_y+'R'+(180-a));
        var path = '';
        if (d > 2*this.ARROW_LENGTH) {
            // draw the arrow
            var
                // left arrow coords
                arrow1_ax = this._p1.x+Math.cos(alpha1+this.ARROW_ANGLE+(this._p2.x<this._p1.x ? Math.PI : 0))*this.ARROW_LENGTH,
                arrow1_ay = this._p1.y+Math.sin(alpha1+this.ARROW_ANGLE+(this._p2.x<this._p1.x ? Math.PI : 0))*this.ARROW_LENGTH,
                arrow1_bx = this._p1.x+Math.cos(alpha1-this.ARROW_ANGLE+(this._p2.x<this._p1.x ? Math.PI : 0))*this.ARROW_LENGTH,
                arrow1_by = this._p1.y+Math.sin(alpha1-this.ARROW_ANGLE+(this._p2.x<this._p1.x ? Math.PI : 0))*this.ARROW_LENGTH,
                // right arrow coords
                arrow2_ax = this._p2.x+Math.cos(alpha1+this.ARROW_ANGLE+(this._p2.x<this._p1.x ? 0 : Math.PI))*this.ARROW_LENGTH,
                arrow2_ay = this._p2.y+Math.sin(alpha1+this.ARROW_ANGLE+(this._p2.x<this._p1.x ? 0 : Math.PI))*this.ARROW_LENGTH,
                arrow2_bx = this._p2.x+Math.cos(alpha1-this.ARROW_ANGLE+(this._p2.x<this._p1.x ? 0 : Math.PI))*this.ARROW_LENGTH,
                arrow2_by = this._p2.y+Math.sin(alpha1-this.ARROW_ANGLE+(this._p2.x<this._p1.x ? 0 : Math.PI))*this.ARROW_LENGTH;
            path +=
                'M'+arrow1_ax+' '+arrow1_ay+'L'+this._p1.x+' '+this._p1.y+'L'+arrow1_bx+' '+arrow1_by + // left arrow
                'M'+arrow2_ax+' '+arrow2_ay+'L'+this._p2.x+' '+this._p2.y+'L'+arrow2_bx+' '+arrow2_by; // right arrow
        }

        var l1x, l1y, l2x, l2y, l3x, l3y, l4x, l4y;
        if (box_w<=d) {
            var xa = this._p1.x+(this._p2.x-this._p1.x-Math.cos(alpha)*box_w)/2, // punto di interruzione della linea a sx dell'etichetta
                ya = m*xa+q;
            var xb = this._p1.x+(this._p2.x-this._p1.x+Math.cos(alpha)*box_w)/2, // punto di interruzione della linea a dx dell'etichetta
                yb = m*xb+q;
            if (isNaN(ya) || isNaN(yb)) {
                // vertical line
                ya = this._p1.y+(d-box_w)/2*(this._p2.y>this._p1.y ? 1 : -1);
                yb = this._p2.y-(d-box_w)/2*(this._p2.y>this._p1.y ? 1 : -1);
            }
            this._linea.attr('path',
                'M'+this._p1.x+' '+this._p1.y+'L'+xa+' '+ya +  // linea da p1 a sx dell'etichetta
                'M'+xb+' '+yb+' L'+this._p2.x+' '+this._p2.y + // linea da dx dell'etichetta a p2
                path
            );
            // sfondo dell'etichetta in mezzo alla linea
            l1x = xa+Math.sin(alpha1)*(box_h/2);
            l1y = ya-Math.cos(alpha1)*(box_h/2);
            l2x = xa-Math.sin(alpha1)*(box_h/2);
            l2y = ya+Math.cos(alpha1)*(box_h/2);
            l3x = xb-Math.sin(alpha1)*(box_h/2);
            l3y = yb+Math.cos(alpha1)*(box_h/2);
            l4x = xb+Math.sin(alpha1)*(box_h/2);
            l4y = yb-Math.cos(alpha1)*(box_h/2);
            this._linea2.attr('path',
                'M'+this._p1.x+' '+this._p1.y+'L'+xa+' '+ya+ // sfondo della linea: primo tratto
                'M'+xb+' '+yb+'L'+this._p2.x+' '+this._p2.y+ // sfondo della linea: secondo tratto
                'M'+l1x+' '+l1y+'L'+l2x+' '+l2y+'L'+l3x+' '+l3y+'L'+l4x+' '+l4y+'Z' // // disegna lo sfondo sotto l'etichetta
            );
        } else {
            // etichetta dopo la linea
            this._linea.attr('path',
                'M'+this._p1.x+' '+this._p1.y+'L'+this._p2.x+' '+this._p2.y + // linea da p1 a sx dell'etichetta
                path
            );
            if (this._p1.x==this._p2.x) {
                // gestisce il caso particolare della misura verticale
                l1x = this._p2.x-(box_h/2);
                l1y = this._p2.y;
                l2x = l1x;
                l2y = l1y+(this._p2.y<this._p1.y ? -1 : 1)*box_w;

                l3x = l1x+box_h;
                l3y = l2y;
                l4x = l3x;
                l4y = l1y;
            } else {
                l1x = this._p2.x+Math.sin(alpha1)*(box_h/2);
                l1y = this._p2.y-Math.cos(alpha1)*(box_h/2);
                l2x = this._p2.x-Math.sin(alpha1)*(box_h/2);
                l2y = this._p2.y+Math.cos(alpha1)*(box_h/2);

                l3x = this._p2.x+(this._p2.x>this._p1.x ? 1 : -1)*Math.cos(alpha1)*box_w-Math.sin(alpha1)*(box_h/2);
                l3y = this._p2.y+(this._p2.x>this._p1.x ? 1 : -1)*Math.sin(alpha1)*box_w+Math.cos(alpha1)*(box_h/2);
                l4x = this._p2.x+(this._p2.x>this._p1.x ? 1 : -1)*Math.cos(alpha1)*box_w+Math.sin(alpha1)*(box_h/2);
                l4y = this._p2.y+(this._p2.x>this._p1.x ? 1 : -1)*Math.sin(alpha1)*box_w-Math.cos(alpha1)*(box_h/2);
            }
            this._linea2.attr('path',
                'M'+this._p1.x+' '+this._p1.y+'L'+this._p2.x+' '+this._p2.y+ // sfondo della linea
                'M'+l1x+' '+l1y+'L'+l2x+' '+l2y+'L'+l3x+' '+l3y+'L'+l4x+' '+l4y+'Z' // // disegna lo sfondo sotto l'etichetta
            );
        }
    },

    /** Registra una funzione di callback da eseguire al cambiamento della misura
      * La funzione è del tipo function(Quote, misura, angolo, unità, scala)
      */
    registerListner: function(callback) {
        this._listners.push(callback);
    },
    /** Deregistra una funzione di callback da eseguire al cambiamento della misura */
    unregisterListner: function(callback) {
        var i = this._listners.indexOf(callback);
        if (i>=0)
            this._listners.splice(i, 1);
    },
    clearListners: function() {
        this._listners = [];
    },

    /** Esegue tutte le funzioni di callback */
    _callListners: function(force) {
        if (typeof force=='undefined') force=false;
        if (!this._listners.length) return;
        var d = this.getDistance(),
            a = this.getAngle(),
            s = this.scale(),
            u = this.unit()/* *s */;
        if (this._old_d==d && this._old_a==a && this._old_u==u && this._old_s==s && !force) return; // nessuna modifica
        this._old_d = d;
        this._old_a = a;
        this._old_u = u;
        this._old_s = s;
        //console.log('update listners: dist', d+'px', 'angle', a+'rad', 'unit', u, 'scale', s);
        for (var i=0, n=this._listners.length; i<n; i++) {
            this._listners[i].call(null, this, d, a, u, s);
        }
    },

    /** Imposta la posizione del primo punto */
    setP1: function(x1, y1) {
        this._p1.x = x1; this._p1.y = y1;
        this._hotspot1.attr(
            {
                cx: this._p1.x,
                cy: this._p1.y
            }
        );
        this.draw();
        this._callListners();
    },
    getP1x: function() { return this._p1.x; },
    getP1y: function() { return this._p1.y; },

    /** Imposta la posizione del secondo punto */
    setP2: function(x2, y2) {
        this._p2.x = x2; this._p2.y = y2;
        this._hotspot2.attr(
            {
                cx: this._p2.x,
                cy: this._p2.y
            }
        );
        this.draw();
        this._callListners();
    },
    getP2x: function() { return this._p2.x; },
    getP2y: function() { return this._p2.y; },

    /** Imposta i punti della quota
      * @param x1, y1 coordinate del primo punto
      * @param x2, y2 coordinate del secondo punto
      * @param constraint se true indica di vincolare la posizione del secondo punto ai gradi 0, 45 e 90
      **/
    setP1P2: function(x1, y1, x2, y2, constraint, sendevents) {
        if (typeof constraint=='undefined') constraint = false;
        if (typeof sendevents=='undefined') sendevents = true;
        this._p1.x = x1; this._p1.y = y1;
        this._hotspot1.attr(
            {
                cx: this._p1.x,
                cy: this._p1.y
            }
        );
        if (constraint) {
            var m = (y2-y1)/(x2-x1); // coefficiente angolare
            var a = Math.abs(Math.atan(m)); // angolo in radianti
            if (a<Math.PI/8) {
                this._p2.x = x2; // vincola sull'asse delle ascisse
                this._p2.y = this._p1.y;
            } else if (a>=(1/8)*Math.PI && a<=(3/8)*Math.PI) {
                this._p2.x = x2; // vincola sulla bisettrice
                this._p2.y = this._p1.y+(y2<y1 ? -1 : 1)*Math.abs(x2-x1);
            } else {
                this._p2.x = x1; // vincola sull'asse delle ordinate
                this._p2.y = y2;
            }
        } else {
            this._p2.x = x2;
            this._p2.y = y2;
        }
        this._hotspot2.attr(
            {
                cx: this._p2.x,
                cy: this._p2.y
            }
        );
        if (sendevents)
            this._callListners();
        this.draw();
    },

    /** Transla la misura della distanza indicata */
    translate: function(dx, dy, sendevents) {
        if (dx===0 && dy===0) return;
        this.setP1P2(this._p1.x+dx, this._p1.y+dy, this._p2.x+dx, this._p2.y+dy, false, sendevents);
    }
});

/** Strumento di misura
  * A differenza di Quote la misura può essere tracciata anche come raggio di un cerchio.
  */
var Misura = new Class({
    Extends: Quote,
    version: '1.0.0',

    initialize: function (paper) {
        // elementi SVG
        this._cerchio    = {};
        // impostazioni
        this._showCircle = true; // indica se mostrare il cerchio con raggio pari alla misura

        this._quote = null;

        this.parent(paper);

        if (typeof paper=='undefined')
            return;

        this._cerchio =
            paper.circle(0, 0, 0)
                .attr("stroke", this.linecolor())
                .hide();
        this._cerchio.strumento = this;
        this._set.push(this._cerchio);
        this.circleVisible(this._showCircle);
        // disattiva il doppioclick sull'etichetta
        this._label.undblclick(this._labeldblclick);
    },

    getLabel: function() {
        var d = this.getDistance() / this.unit() / this.scale(); // misura della quota
        return d.toFixed(2);
    },

    /** Indica se il cerchio della misura deve essere visibile o meno */
    circleVisible: function(v) {
        if (typeof v == 'undefined')
            return this._showCircle;
        else {
            this._showCircle = v;
            if (this._showCircle) {
                this._cerchio
                    .attr(
                        {
                            cx: this._p1.x,
                            cy: this._p1.y,
                            r: this.getDistance()
                        }
                    )
                    .show();
            } else
                this._cerchio.hide();
        }
    },

    /** Imposta il colore della linea */
    linecolor: function(c) {
        if (typeof c == 'undefined')
            return this.parent(c);
        else {
            this.parent(c);
            this._cerchio.attr("stroke", this._linecolor);
        }
    },

    /** Disegna la linea di misura */
    draw: function() {
        this.parent();
        if (this.circleVisible())
            this._cerchio.attr('r', this.getDistance());
    },

    setP1: function(x1, y1) {
        this.parent(x1, y1);
        if (this.circleVisible()) {
            this._cerchio
                .attr(
                    {
                        cx: this._p1.x,
                        cy: this._p1.y
                    }
                );
        }
    },
    setP1P2: function(x1, y1, x2, y2, constraint) {
        this.parent(x1, y1, x2, y2, constraint);
        if (this.circleVisible())
            this._cerchio
                .attr(
                    {
                        cx: this._p1.x,
                        cy: this._p1.y
                    }
                );
    },

    /** Registra una quota in modo che al suo cambiamento si aggiorni l'unità della misura */
    quote: function(quote) {
        if (typeof quote=='undefined')
            return this._quote;
        else {
            if (quote && !quote instanceof Quote) throw('The quote is not a Quote object!');
            // rilascia la quota precedentmente registrata
            if (this._quote && this._quotechanged)
                this._quote.unregisterListner(this._quotechanged);
            this._quote = quote;
            if (quote) {
                var me = this;
                // registra una funzione di callback che aggiorni l'unità quando la quota di riferimento cambia
                // this._quotechanged = function(quota, distance, angle, unit) { me.handleQuoteChanged.apply(me, arguments); };
                this._quotechanged = function(quota, distance, angle, unit, scale) {
                    //console.log('Quote changed: ', distance, angle, unit, scale);
                    me.unit((distance/scale)/unit);
                };
                this._quote.registerListner(this._quotechanged);
                this.unit((this._quote.getDistance() / this._quote.scale())/this._quote.unit());
            }
        }
    }
});

