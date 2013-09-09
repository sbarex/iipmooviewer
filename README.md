IIPMooViewerDim
===============


About
-----

Versione estesa di IIPMooViewer che permette di effetturare misure sull'immagine.
Basato su IIPMooViewer di Ruven Pillay <ruven@users.sourceforge.net> con l'ausilio della libreria Raphaël.js <http://raphaeljs.com>

Features
--------
* aggiunta di quote interattive
* diverse unità di misura
* sistema interattivo per personalizzare le unità di misura

Configuration
-------------
Now modify the path and image names in the example HTML page provided - index.html - to create a working client :-)
<pre>
    var iipmooviewer = new IIPMooViewerDim( "viewer", {
      image: "/path/to/image.tif",
      credit: "My Title",
      measureExpanded: false, // show the quote panel at the start-up
      scale: 15.3, // number of pixel in a mm
    });
</pre>

Usage
-----
From the navigation panel click the ruler to show/hide the measure tools.
When measure tool are visibile:


* you can't drag the image with mouse
* if there is only one quote, click and drag draw the quote in another place (shift key lock on 45° step)
* you can refine a quote dragging the arrows
* you can drag a quote from the label
* from the measure panel you can switch from several measure unit and define a custom reference
* with custom unit active, on the image is visible a red quote. This is the reference of all other quote. Set a distance with the red quote, and double click on label (or click on "..." button in measure panel) to set the equivalent distance
* in the meausure panel, clicking on the colored icon of a quote can switch from simple line and circle.

Distribution
------------
/javascript : the necessary minified iipmooviewer and mootools javascript files

/css : iip.css, iipdim.css and ie.css (for Internet Explorer)

/images : icons and image files

/src : uncompressed source javascript files

Options
-------

Additional options to the IIPMooViewerDim class constructor:

<b>measureExpanded</b> : show the measure panel at the start up. [default: false]

<b>scale</b> : number of pixel in a mm. Required to show the measure tools.

Public Functions
----------------

<b>showMeasureTools(state, animate)</b>: Show/Hide the measures panel.

