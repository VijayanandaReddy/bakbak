#All the basic models are defined here.

MouseTrack.js model is used for click heatmap.
Each url to track muse on creates a new document in the db.
Mouse is Tracked by element and offset where it was clicked. Element is passed by Ui as a unique identifier on the page and xy is the click count.
If that element and click position exist we increase the count else we create a new entry.
 
