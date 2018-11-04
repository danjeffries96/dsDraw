ENTER = 13;
CTRL = 17;

class FlowchartBox {
  constructor(canvasState) {
    this.cState = canvasState;
    this.ctx = canvasState.ctx;
    this.hitCtx = canvasState.hitCtx;
    this.hashColor = null;

    this.x1 = this.cState.mouseDown.x;
    this.y1 = this.cState.mouseDown.y;
    this.x2 = this.cState.mouseUp.x;
    this.y2 = this.cState.mouseUp.y;

    this.anchors = [];

    this.width = this.x2 - this.x1;
    this.height = this.y2 - this.y1;

    this.fill = "#fff";
    this.border =  "#000";
    this.fontStyle = null;
    this.fontFamily = "Purisa";
    this.fontSize = "12px";
    this.textAlign = "left";
    this.textX = this.x1;

    this.text = "";
    this.wrappedText = [];

    this.editor = this.createEditor();
  }

  getToolbar() {
    return FlowchartToolbar.getInstance(this.cState);
  } 

  getOptions() {
    return FlowchartBoxOptions.getInstance(this.cState);
  }

  /* createEditor
   *  initializes <textarea> element for editing text
   *  inside flowchart element
   *
   *  TODO:
   *    - allow user to press enter early
   *    (perhaps shift+enter)
   */
  createEditor() {
    var editor = document.createElement("textarea");
    editor.style.width = this.width + "px";
    editor.style.height = this.height + "px";
    editor.style.background = this.fill;
    editor.style.position = "absolute"; 
    editor.style.border = "0";

    // set position
    editor.style.top = this.y1 + "px";
    editor.style.left = this.x1 + "px";

    // disable resize
    editor.style.resize = "none";

    // hide until flowchart box clicked
    editor.hidden = true;

    // add to document body
    document.body.appendChild(editor);
  
    // end editing with enter key
    var self = this;
    editor.onkeydown = function(event) {
      if (event.keyCode == ENTER) {
        self.deactivate();
      }
    };

    return editor;
  }

  configureOptions() {
    this.ctx.strokeStyle = this.border;
    this.ctx.lineWidth = this.borderThickness;
    this.ctx.fillStyle = this.fill;
    
    var font = "";
    if (this.fontStyle)
      font += this.fontStyle + " ";

    font += this.fontSize + " ";
    font += this.fontFamily;

    this.ctx.font = font;
    this.editor.style.font = font;

    this.ctx.textAlign = this.textAlign;

    // change x coordinate for diff alignments
    if (this.textAlign == "left")
      this.textX = this.x1;
    else if (this.textAlign == "right")
      this.textX = this.x2;
    else if (this.textAlign == "center")
      this.textX = Math.floor((this.x1 + this.x2) / 2);

    this.hitCtx.fillStyle = this.hashColor;
  }

  /* draw
   * renders rectangular box on main canvas
   * and hitCanvas and draws wrapped words
   *
   * TODO:
   *  - check for overflow in y direction
   *
   *  - add some margin options
   *
   *  - add anchor points
   */
  draw() {
    this.configureOptions();
     
    this.ctx.beginPath();
    this.ctx.rect(this.x1, this.y1, this.width, this.height);
    this.ctx.fillRect(this.x1, this.y1, this.width, this.height);
    this.ctx.stroke();
    
    // helper method for text
    this.drawText();

    // draw to hit detection canvas
    this.hitCtx.beginPath();
    this.hitCtx.fillRect(this.x1, this.y1, this.width, this.height);
    this.hitCtx.stroke();

  }

  drawText() {
    // approximate height
    var ht = this.ctx.measureText("_").width * 2;
    var lineY = this.y1 + ht;
    this.ctx.fillStyle = "#000";
    for (var i = 0; i < this.wrappedText.length; i++) {
      // don't fill past container
      if (lineY + ht > this.y2) {
        this.ctx.fillText("...", this.textX, lineY);
        break;
      }

      this.ctx.fillText(this.wrappedText[i], this.textX, lineY);
      lineY += ht;
    }
    this.ctx.stroke();
  }

  drag(deltaX, deltaY) {
    this.x1 += deltaX;
    this.x2 += deltaX;
    this.y1 += deltaY;
    this.y2 += deltaY; 

    // move editor with box
    this.editor.style.left = this.x1 + "px";
    this.editor.style.top = this.y1 + "px";

    // move anchor points with box
    this.anchors.forEach(function(point) {
      point.x += deltaX;
      point.y += deltaY;
    });
  }

  /*  click(event)
   *  bring up <textarea> to edit text
   */
  click(event) {
    this.editor.hidden = false;

    // necessary for focus/select behavior
    event.preventDefault();
    this.editor.select();
  } 

  deactivate() {
    this.editor.hidden = true;
    this.text = this.editor.value;
    this.textEntered();
  }

  /* textEntered
   * performs word wrap 
   * 
   * TODO:
   *  - do letter level wrap
   *  for single words that exceed 
   *  width of container
   *
   *  - consider case where multiple spaces
   *  occur between words
   *
   */
  textEntered() {
    //update text options
    this.configureOptions();

    var words = this.editor.value.split(" ");

    var wrappedText = [];

    // check that no words are too long to fit in container
     
    
    var line = "";
    var curWidth = 0;
    var lineWidth = 0;
    for (var i = 0; i < words.length; i++) {
      curWidth = this.ctx.measureText(words[i] + " ").width;
      
      lineWidth += curWidth;
      if (lineWidth > this.width) {
        // draw current line and reset
        wrappedText.push(line);
        lineWidth = curWidth;
        line = "";
      }
      line += words[i] + " ";
    }
    // add final line
    wrappedText.push(line);
    
    this.wrappedText = wrappedText;
  }
}

class RectBox extends FlowchartBox {

  constructor(canvasState) {
    super(canvasState);

    // set borderThickness lower for rect command
    this.borderThickness = 2;

    // add self to list of canvas objects
    this.cState.addCanvasObj("rectBox", this);

    this.addAnchors();
  }

  addAnchors() {
    // add anchors at midpoint of each side
    var xMid = Math.floor((this.x2 + this.x1) / 2);
    var yMid = Math.floor((this.y2 + this.y1) / 2);

    this.anchors.push(new AnchorPoint(this.cState, this, this.x1, yMid));
    this.anchors.push(new AnchorPoint(this.cState, this, this.x2, yMid));
    this.anchors.push(new AnchorPoint(this.cState, this, xMid, this.y1));
    this.anchors.push(new AnchorPoint(this.cState, this, xMid, this.y2));
  }

  static outline(cState) {
    cState.ctx.strokeStyle = "#000";
    var w = cState.mouseMove.x - cState.mouseDown.x;
    var h = cState.mouseMove.y - cState.mouseDown.y;
    cState.ctx.rect(cState.mouseDown.x, cState.mouseDown.y, w, h);
    cState.ctx.stroke();
  }

}

class RoundBox extends FlowchartBox {
  
  constructor(canvasState) {
    super(canvasState);

    // add self to list of canvas objects
    this.cState.addCanvasObj("roundBox", this);

    this.radius = 10;

    // need extra border thickness parameter
    // because using custom path instead of ctx.rect()
    this.borderThickness = 2;
  } 

  configureOptions() {
    super.configureOptions();
    this.ctx.lineWidth = this.borderThickness;
  }

  draw() {
    this.configureOptions();
    // draw rounded box
    this.ctx.beginPath();
    
    this.ctx.moveTo(this.x1 + this.radius, this.y1);
    this.ctx.lineTo(this.x2 - this.radius, this.y1);
    this.ctx.quadraticCurveTo(this.x2, this.y1, this.x2, this.y1 + this.radius);
    this.ctx.lineTo(this.x2, this.y2 - this.radius);
    this.ctx.quadraticCurveTo(this.x2, this.y2, this.x2 - this.radius, this.y2);
    this.ctx.lineTo(this.x1 + this.radius, this.y2);
    this.ctx.quadraticCurveTo(this.x1, this.y2, this.x1, this.y2 - this.radius);
    this.ctx.lineTo(this.x1, this.y1 + this.radius);
    this.ctx.quadraticCurveTo(this.x1, this.y1, this.x1 + this.radius, this.y1);
    this.ctx.closePath();

    this.ctx.stroke();
    this.ctx.fill();

    // helper method for text
    this.drawText();

    // draw to hit detection canvas
    this.hitCtx.beginPath();
    this.hitCtx.fillRect(this.x1, this.y1, this.width, this.height);
    this.hitCtx.stroke();
  }

  /*
   * TODO:
   *  implement outline for roundBox
   */
  static outline(cState) {
  }
}

class DiamondBox extends FlowchartBox {

  constructor(canvasState) {
    super(canvasState);

    // add self to list of canvas objects
    this.cState.addCanvasObj("diamondBox", this);

    // need extra border thickness parameter
    // because using custom path instead of ctx.rect()
    this.borderThickness = 2;
  } 

  configureOptions() {
    super.configureOptions();
    this.ctx.lineWidth = this.borderThickness;
  }
  
  /*  draw
   *    currently creates diamond that
   *    circumscribes box drawn by mouse
   */
  draw() {
    this.configureOptions();
    this.ctx.beginPath();
    
    var hw = Math.floor(this.width / 2);
    var hh = Math.floor(this.height / 2);
      
    this.ctx.moveTo(this.x1 - hw, this.y1 + hh);
    this.ctx.lineTo(this.x1 + hw, this.y1 - hh);
    this.ctx.lineTo(this.x2 + hw, this.y1 + hh);
    this.ctx.lineTo(this.x1 + hw, this.y2 + hh);
    this.ctx.lineTo(this.x1 - hw, this.y1 + hh);

    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fill();

    // draw text
    this.drawText();

    this.hitCtx.beginPath();
    this.hitCtx.moveTo(this.x1 - hw, this.y1 + hh);
    this.hitCtx.lineTo(this.x1 + hw, this.y1 - hh);
    this.hitCtx.lineTo(this.x2 + hw, this.y1 + hh);
    this.hitCtx.lineTo(this.x1 + hw, this.y2 + hh);
    this.hitCtx.lineTo(this.x1 - hw, this.y1 + hh);

    this.hitCtx.closePath();
    this.hitCtx.stroke();
    this.hitCtx.fill();
  }

  static outline(cState) {
    var x1 = cState.mouseDown.x;
    var y1 = cState.mouseDown.y;
    var x2 = cState.mouseMove.x;
    var y2 = cState.mouseMove.y;
    var hw = Math.floor((x2 - x1)/ 2);
    var hh = Math.floor((y2 - y1)/ 2);

    cState.ctx.beginPath();
    cState.ctx.strokeStyle = "#000";
    cState.ctx.moveTo(x1 - hw, y1 + hh);
    cState.ctx.lineTo(x1 + hw, y1 - hh);
    cState.ctx.lineTo(x2 + hw, y1 + hh);
    cState.ctx.lineTo(x1 + hw, y2 + hh);
    cState.ctx.lineTo(x1 - hw, y1 + hh);
    
    cState.ctx.stroke();
  }

}

/*  Arrow class for drawing arcs on canvas.
 *  Composed with ArrowHead which can 
 *  vary independently of Arrow attributes
 *
 *  Can be curved or composed of several
 *  straight segments with anchor points.
 *
 *  Main attributes:
 *    - thickness
 *    - solid/dashed
 *
 */
class Arrow {

  constructor(canvasState) {
    this.cState = canvasState;
    this.ctx = canvasState.ctx;
    this.hitCtx = canvasState.hitCtx;
    this.hashColor = null;

    this.startX = this.cState.mouseDown.x;
    this.startY = this.cState.mouseDown.y;
    this.endX = this.cState.mouseUp.x;
    this.endY = this.cState.mouseUp.y;

    // default options
    this.thickness = 2;
    this.strokeColor = "#000";

    // default hit thickness
    this.hitThickness = 8;
  }

  deactivate() {

  }

  getToolbar() {
    return FlowchartToolbar.getInstance(this.cState);
  }

  getOptions() {
    return ArrowOptions.getInstance(this.cState);
  }

}

/*  RightAngleArrow class to handle
 *  arrow composed of solely right angles.
 *
 *  To add a new right angle, click on arrow head
 *  and drag in new direction.
 *
 */
class RightAngleArrow extends Arrow {
  constructor(canvasState) {
    super(canvasState); 

    // force axis alignment
    this.endY = this.startY;

    this.anglePoints = [];
    this.addedNewAngle = false;

    this.cState.addCanvasObj("RAArrow", this);

    // create ArrowHead
    // (handled here because of forced alignment)
    this.head = new ArrowHead(canvasState, this);
  }

  /*  endingOrientation()
   *    return up/down/left/right
   *    so arrowhead can be positioned appropriately
   */
  endingOrientation() {
    var penultimate = null;
    if (this.anglePoints.length > 0) {
      penultimate = this.anglePoints[this.anglePoints.length-1];
    } else {
      penultimate = {x: this.startX, y: this.startY};
    }

    //up
    if (this.endY - penultimate.y < 0) 
      return "U"; 
    //down
    if (this.endY - penultimate.y > 0)
      return "D";      
    //left
    if (this.endX - penultimate.x < 0)      
      return "L"
    //right
    if (this.endX - penultimate.x > 0)
      return "R"

    // default
      return "R"
  }

  configureOptions() {
    this.ctx.lineWidth = this.thickness;
    this.ctx.strokeStyle = this.strokeColor;

    this.hitCtx.strokeStyle = this.hashColor;
    this.hitCtx.lineWidth = this.hitThickness;
  }

  /*  draw()
   *    draw line segments to canvas
   *    (draw slightly thicker on hit canvas so
   *    arrow can be more easily clicked)
   */
  draw() {
    this.configureOptions();

    var curX = this.startX;
    var curY = this.startY;

    var ctx = this.ctx;
    var hitCtx = this.hitCtx;

    ctx.beginPath();
    ctx.moveTo(curX, curY);

    hitCtx.beginPath();
    hitCtx.moveTo(curX, curY);

    this.anglePoints.forEach(function(point) {
      ctx.lineTo(point.x, point.y);
      ctx.moveTo(point.x, point.y);

      hitCtx.lineTo(point.x, point.y);
      hitCtx.moveTo(point.x, point.y);

      curX = point.x;
      curY = point.y;
    });

    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();

    hitCtx.lineTo(this.endX, this.endY);
    hitCtx.stroke();

    // draw arrowhead
    this.head.draw();
  }

  /*  click(event)
   *    bring up options for this particular arrow
   *    or extend/create new angle if clicking arrowhead
   */
  click(event) {
    // if click is on arrowhead 
  }

  drag(deltaX, deltaY) {
    this.startX += deltaX;
    this.startY += deltaY;

    this.anglePoints.forEach(function(point) {
      point.x += deltaX;
      point.y += deltaY;
    });

    this.endX += deltaX;
    this.endY += deltaY;

  }

  static outline(cState) {
    var x1 = cState.mouseDown.x;
    var y1 = cState.mouseDown.y;
    var x2 = cState.mouseMove.x;     

    cState.ctx.strokeStyle = "#000";
    cState.ctx.beginPath();
    cState.ctx.moveTo(x1, y1);
    cState.ctx.lineTo(x2, y1);
    cState.ctx.stroke();
  }

}


class ArrowHead {
  constructor(canvasState, parentArrow) {
    this.cState = canvasState;
    this.ctx = this.cState.ctx;
    this.hitCtx = this.cState.hitCtx;
    this.arrow = parentArrow;

    // center of fat end of arrowhead
    this.baseX = this.arrow.endX;
    this.baseY = this.arrow.endY;

    this.hollow = true;
    this.fill = "#fff";

    this.width = 20;
    this.height = 20;

    this.cState.addCanvasObj("arrowHead", this);
  }

  getToolbar() {
    return FlowchartToolbar.getInstance(this.cState);
  }

  getOptions() {
    return ArrowOptions.getInstance(this.cState);
  }

  deactivate() {

  }
  
  getPoints() {
    // p1 and p2 form base, p3 is tip
    var p1, p2, p3;

    // check orientation of final arrow segment
    var ori = this.arrow.endingOrientation();

    var hw = Math.floor(this.width / 2);

    if (ori == "U") {
      p1 = {x: this.baseX - hw, y: this.baseY};
      p2 = {x: this.baseX + hw, y: this.baseY};
      p3 = {x: this.baseX, y: this.baseY - this.height};
    } else if (ori == "D") {
      p1 = {x: this.baseX - hw, y: this.baseY};
      p2 = {x: this.baseX + hw, y: this.baseY};
      p3 = {x: this.baseX, y: this.baseY + this.height};
    } else if (ori == "L") {
      p1 = {x: this.baseX, y: this.baseY + hw};
      p2 = {x: this.baseX, y: this.baseY - hw};
      p3 = {x: this.baseX - this.height, y: this.baseY};
    } else if (ori == "R") {
      p1 = {x: this.baseX, y: this.baseY + hw};
      p2 = {x: this.baseX, y: this.baseY - hw};
      p3 = {x: this.baseX + this.height, y: this.baseY};
    }

    return [p1, p2, p3];
  }

  configureOptions() {
    this.ctx.strokeStyle = this.arrow.strokeColor;
    this.ctx.fillStyle = this.fill;
    this.hitCtx.fillStyle = this.hashColor;
  }

  draw() {
    this.configureOptions();

    // parent arrow end may have changed 
    // so update coordinates
    this.baseX = this.arrow.endX;
    this.baseY = this.arrow.endY;

    var p1, p2, p3;
    [p1, p2, p3] = this.getPoints();

    this.ctx.beginPath();

    this.hitCtx.moveTo(p1.x, p1.y);
    this.hitCtx.lineTo(p2.x, p2.y);
    this.hitCtx.lineTo(p3.x, p3.y);
    this.hitCtx.fill();

    if (this.hollow) {
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.moveTo(p2.x, p2.y);
      this.ctx.lineTo(p3.x, p3.y);
      // fill in arrow line where filled head would be
      this.ctx.moveTo(this.arrow.endX, this.arrow.endY);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.stroke();
    } 
    else {
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  click(event) {
    
  }

  release() {
    if (this.arrow instanceof RightAngleArrow)
      this.arrow.addedNewAngle = false;
  }

  /*  drag(deltaX, deltaY)
   *    shift arrow end point by deltaX, deltaY
   *    and add a new anglePoint if RAArrow 
   *
   */
  drag(deltaX, deltaY) {
    if (this.arrow instanceof RightAngleArrow) {
      var ori = this.arrow.endingOrientation();
      
      var addNew = this.cState.hotkeys[CTRL];

      if (addNew && ! this.arrow.addedNewAngle) {
        // dont allow user to add more than one angle per drag
        this.arrow.addedNewAngle = true;

        this.arrow.anglePoints.push({x: this.arrow.endX, y: this.arrow.endY});
        if (ori == "U" || ori == "D") {
          this.arrow.endX += deltaX;
        } else {
          this.arrow.endY += deltaY;    
        }
      } else {
        if (ori == "U" || ori == "D") {
          this.arrow.endY += deltaY;    
        } else {
          this.arrow.endX += deltaX;
        }
      }

      // check if tip is on anchor point
      // TODO:
      //  need to consider case where arrow is created later
      //  and thus its color is on top
      //  -> easy fix: just check color 1 pixel ahead of arrow
      var hoverObj = this.cState.getClickedObject(
          this.arrow.endX + this.arrow.head.height + 1, this.arrow.endY
      );
      if (hoverObj instanceof AnchorPoint) {
        // set arrow end to center of anchor - arrow tip height
        var ori = this.arrow.endingOrientation();
        if (ori == "L" || ori == "R")
          this.arrow.endX = hoverObj.x - this.height;
        else
          this.arrow.endY = hoverObj.y - this.height;
        hoverObj.anchoredArrow = this.arrow;
      }
    }
  }
}


/*  AnchorPoint class handles anchoring of flowchart
 *  arcs to flowchart boxes. Arrows snap to anchors when
 *  dragged within their radius.
 *  When boxes get moved, 
 *  anchored arrows get updated automatically
 *
 *  TODO:
 *    automatically update arrows
 */
class AnchorPoint {
  constructor(canvasState, parentBox, x, y) {
    this.cState = canvasState;
    this.ctx = canvasState.ctx;
    this.hitCtx = canvasState.hitCtx;
    this.hashColor = null;
    
    this.parentBox = parentBox;

    this.anchoredArrow = null;

    this.x = x;
    this.y = y;

    // default radius 
    // (snap to this anchor if within radius)
    this.radius = 30;

    this.cState.addCanvasObj("anchor", this);
  }

  draw() {
    // force anchored arrow to update position
    // if (this.anchoredArrow)
    //   this.anchoredArrow.moveEnd(this.x, this.y);
     
    // only draw to hit detect canvas
    this,hitCtx.fillStyle = this.hashColor;
    this.hitCtx.beginPath();
    this.hitCtx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.hitCtx.fill();
  }
  
  getToolbar() {
    return this.parentBox.getToolbar();
  }

  getOptions() {
    return this.parentBox.getOptions();
  }

  /*  click
   *    pass click event to parent text box
   */
  click(event) {
    this.parentBox.click(event);
  }

  drag(deltaX, deltaY) {
    this.parentBox.drag(deltaX, deltaY);
  }

  click(event) {
    this.parentBox.click(event);
  }

}
