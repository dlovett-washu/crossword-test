var ipuz = {
    "version": "http://ipuz.org/v2",
    "kind": ["http://ipuz.org/crossword#1"],
    "dimensions": {"width": 0, "height": 0},
    "puzzle": [],
    "solution": [],
    "clues": {
        "Across": [],
        "Down": []
    },
    "title": "",
    "author": "",
    "copyright": "",
    "origin": "",
    "block": " ",
    "empty": "0"
}

var clueList = {
    "Across": {},
    "Down": {}
};

var cursorDirection = 0; // 0 is horizontal
var ns = "http://www.w3.org/2000/svg";
var svg = null;
var sync = 1; // 1 is standard symmetry 

var updateLinked = function() {
    var linkIcon = document.getElementById("linkIcon")
    var linkIconCell = document.getElementById("linkIconCell")
    if (linkIcon.innerHTML == "link") {
        linkIcon.innerHTML = "link_off"
        linkIconCell.classList.remove("iconOn")
        linkIconCell.classList.add("iconOff")
    } else {
        linkIcon.innerHTML = "link"
        linkIconCell.classList.remove("iconOff")
        linkIconCell.classList.add("iconOn")
    }
}

var updateDims = function(evt) {
    var linkIcon = document.getElementById("linkIcon")
    var thisNode = evt.path[0]
    if (thisNode.id == "height") {
        var thatNode = document.getElementById("width")
    } else {
        var thatNode = document.getElementById("height")
    }
    if (linkIcon.innerHTML == "link") {
        thatNode.value = thisNode.value
    }
}

var updateDirection = function() {
    var dirIcon = document.getElementById("dirIcon")
    if (dirIcon.innerHTML == "swap_horiz") {
        dirIcon.innerHTML = "swap_vert"
        cursorDirection = 1 // vertical
    } else {
        dirIcon.innerHTML = "swap_horiz"
        cursorDirection = 0 // horizontal
    }
}

var updateSync = function(evt) {
    var syncIcon = document.getElementById("syncIcon");
    var syncDiv = document.getElementById("syncDiv");
    if (syncIcon.innerHTML == "sync") {
        syncIcon.innerHTML = "sync_disabled";
        syncDiv.classList.remove("iconOn");
        syncDiv.classList.add("iconOff");
        sync = 0; // no symmetry
    } else {
        syncIcon.innerHTML = "sync";
        syncDiv.classList.remove("iconOff");
        syncDiv.classList.add("iconOn");
        sync = 1; // standard symmetry 
    }
}

var controlVisibility = function(evt) {
    var evtId = null;
    if (evt.path[0]) {evtId = evt.path[0].id};
    var newGrid = document.getElementById("createNewGrid");
    var loadGrid = document.getElementById("loadGrid");
    var gridSettings = document.getElementById("gridSettings");
    newGrid.style.display = "none";
    loadGrid.style.display = "none";
    gridSettings.style.display = "none";
    if (evtId == "newGridDiv" || evtId == "newGridIcon") {
        newGrid.style.display = "block";
    } else if (evtId == "loadIconDiv" || evtId == "loadIcon") {
        loadGrid.style.display = "block";
    } else {
        gridSettings.style.display = "block";
    };
};


var loadPuzzle = function(evt) {
    var input = document.getElementById("gridFileInput")
    var gridFile = input.files[0]
    var reader = new FileReader();
    reader.onload = function(evt) {
        var jsonObj = JSON.parse(evt.target.result);
        ipuz = jsonObj;
        buildPuzzle(ipuz, evt);
    };
    reader.readAsText(gridFile);
    input.value = ""
    updateLoadButton()
}

var selectAllText = function(evt) {
    this.select();
}

var focusText = function(evt) {
    var text = evt.path[0];
    var textId = text.id;
    var x = textId.split("-")[1]
    var y = textId.split("-")[2]
    var cellId = `cell-${x}-${y}`;
    document.getElementById(cellId).focus();
}

var startup = function() {
    printTitleAuthor();
    document.getElementById("height").focus();
}

var savePuzzle = function() {
    var jsonData = JSON.stringify(ipuz);
    var a = document.createElement("a");
    var file = new Blob([jsonData], {type: "application/json"});
    a.href = URL.createObjectURL(file);
    a.download = "puzzle.json"
    a.click();
    var saveIconDiv = document.getElementById("saveIconDiv")
    saveIconDiv.classList.remove("iconOn")
    saveIconDiv.classList.add("iconOff")
}


var editClue = function(evt) {
    var path = evt.path[0];
    var tag = path.tagName;
    if (tag == "DIV") {
        var id = path.id;
        var direction = id.split("-")[0]
        var label = parseInt(id.split("-")[1])
        var ol = path.childNodes[0];
        var li = ol.childNodes[0];
        li.innerHTML = ""
        var input = document.createElement("input");
        var index = ipuz.clues[direction].findIndex(clue => clue[0] == label)
        var value = ipuz.clues[direction][index][1]
        if (value) {
            input.value = value;
        } else {
            input.value = "";
        }
        // input.value = ipuz.clues[direction].filter(arr => arr[0] == clue)[1]
        input.size = 18;
        input.addEventListener("blur", updateClue);
        li.appendChild(input);
        input.focus();
    }

}

var updateClue = function(evt) {
    var input = evt.path[0];
    var value = input.value
    var li = evt.path[1];
    var id = li.id
    var direction = id.split("-")[0]
    var label = parseInt(id.split("-")[2])
    var index = ipuz.clues[direction].findIndex(clue => clue[0] == label)
    ipuz.clues[direction][index] = [parseInt(label), value]
    li.removeChild(input);
    li.innerHTML = value;
    var clueX = null;
    var clueY = null;
    for (y=0; y<ipuz.dimensions.height; y++) {
        for (x=0; x<ipuz.dimensions.width; x++) {
            if (ipuz.puzzle[y][x] == label) {
                clueX = x;
                clueY = y;
            };
        };
    };
    if (direction == "Across") {
        clueList[direction][clueY][clueX] = [label,value];
    } else {
        clueList[direction][clueX][clueY] = [label,value];
    }
};

var printClues = function() {
    var totalClues = 0;
    for (direction in ipuz.clues) {
        var clues = ipuz.clues[direction];
        var numClues = clues.length;
        totalClues += numClues;
        var div = document.getElementById(direction);
        div.innerHTML = "";
        for (i=0;i<numClues;i++) {
            var label = clues[i][0];
            var clue = clues[i][1];
            var clueDiv = document.createElement("div");
            clueDiv.classList.add("answer")
            clueDiv.id = `${direction}-${label}`;
            clueDiv.tabIndex = 0;
            clueDiv.addEventListener("focus",editClue)
            div.append(clueDiv)
            var ol = document.createElement("ol");
            ol.start = label;
            ol.id = `${direction}-ol-${label}`
            clueDiv.append(ol);
            var li = document.createElement("li");
            li.id = `${direction}-li-${label}`
            li.addEventListener("click",editClue)
            li.innerHTML = clue
            ol.append(li)
            // clueDiv.innerHTML = `<ol start="${label}"><li>${clue}</li></ol>`
            // clueDiv.addEventListener("focus",editClue)
            
        }
    }
    var numWordsDiv = document.getElementById("numWords");
    numWordsDiv.innerHTML = totalClues + " Words";
    var numBlocksDiv = document.getElementById("numBlocks");
    var numBlocks = 0;
    var numCells = 0;
    for (y in ipuz.solution) {
        for (x in ipuz.solution[y]) {
            if (ipuz.solution[y][x] == " " ) {
                numBlocks += 1;
            };
            numCells += 1;
        };
    };
    var percentBlocks = (numBlocks/numCells)*100
    var percentString = percentBlocks.toFixed(2)
    numBlocksDiv.innerHTML = numBlocks + " Blocks (" + percentString + "%)"
}

var updateSyncedCell = function(x,y) {
    var value = ipuz.solution[y][x];
    var syncX = parseInt(ipuz.dimensions.width) - x - 1;
    var syncY = parseInt(ipuz.dimensions.height) - y - 1;
    if ([x,y] != [syncX,syncY]) {
        var syncValue = ipuz.solution[syncY][syncX];
        if (value == " ") {
            ipuz.solution[syncY][syncX] = value;
        } else if (syncValue == " ") {
            ipuz.solution[syncY][syncX] = "";
        };
        updateNums();
        drawCellContent(syncX,syncY,false);
    }
}

var inputKeyDown = function(evt) {
    var arrowKey = (evt.key == "ArrowLeft" || evt.key == "ArrowRight" || evt.key == "ArrowUp" || evt.key == "ArrowDown" || evt.key == "Backspace" || evt.code == "Space")
    if (arrowKey && evt.repeat == true) {
        inputKeyUp(evt)
    }
}

var inputKeyUp = function(evt) {
    var rows = ipuz.dimensions.height;
    var cols = ipuz.dimensions.width;
    var inputId = evt.path[0].id;
    var x = parseInt(inputId.split("-")[1]);
    var y = parseInt(inputId.split("-")[2]);

    // default: move to right cell if direction is horizontal, move to cell below if direction is vertical
    if (cursorDirection == 0) {var direction = 1} else {var direction = 2};
    switch (evt.key) {
        case "Control":
            updateDirection();
            direction = 0; // stay on same cell
            break;
        case "ArrowRight":
            direction = 1; // move to right cell
            break;
        case "ArrowDown":
            direction = 2; // move to cell below
            break;
        case "ArrowLeft":
            direction = 3; // move to left cell
            break;
        case "ArrowUp":
            direction = 4; // move to cell above
            break;
        case "Enter":
            if (cursorDirection == 0) {direction = 1} else {direction = 2};
            break;
        case "Backspace":
            if (cursorDirection == 0) {direction = 3} else {direction = 4};
    };

    switch (direction) {
        case 0: // stay on same cell
            break;
        case 1: // move to right cell
            if (x+1 < cols) {x += 1} else if (y+1 < rows) {x = 0, y += 1} else {x = 0, y = 0};
            break;
        case 2: // move to cell below
            if (y+1 < rows) {y += 1} else if (x+1 < cols) {x += 1, y = 0} else {x = 0, y = 0};
            break;
        case 3: // move to left cell
            if (x > 0) {x -= 1} else if (y > 0) {x = cols-1, y -= 1} else {x = cols-1, y = rows-1};
            break;
        case 4: // move to cell above
            if (y > 0) {y -= 1} else if (x > 0) {x -= 1, y = rows-1} else {x = cols-1, y = rows-1};
            break;
    };

    evt.path[0].blur();
    document.getElementById("cell-"+x+"-"+y).focus();
    if (evt.repeat == false) {
        printClues();
    }
};

var numRowColInputKeyPress = function(evt) {
    if (evt.key == "Enter") {
        updateDims(evt);
        newPuzzle(evt);
    };
};

var updateCell = function(evt) {
    var input = evt.path[0];
    var foreignObject = evt.path[2];
    var inputId = input.id;
    var x = inputId.split("-")[1];
    var y = inputId.split("-")[2];
    var cell = document.getElementById(`cell-${x}-${y}`);
    var value = input.value.toUpperCase();
    ipuz.solution[y][x] = value;
    drawCellContent(x,y,false)
    if (sync == 1) {
        updateSyncedCell(x,y);
    }
    updateNums();
    svg.removeChild(foreignObject);
};

var removeText = function(i,j) {
    var text = document.getElementById("text-"+i+"-"+j);
    if (text) {
        svg.removeChild(text);
        return text.innerHTML
    } else {
        return ""
    }
}

var cellInput = function(evt) {
    var cell = evt.path[0];
    var cellId = cell.id;
    var x = cellId.split("-")[1];
    var y = cellId.split("-")[2];
    drawCellContent(x,y,evt);
    // updateNums();
    document.getElementById(`input-${x}-${y}`).focus();
};

var updateLoadButton = function() {
    var gridFile = document.getElementById("gridFileInput").files[0];
    var loadFileButton = document.getElementById("loadFile");
    if (gridFile) {
        loadFileButton.disabled = false;
    } else {
        loadFileButton.disabled = true;
    }
}

var newPuzzle = function(evt) {
    ipuz.dimensions.height = document.getElementById("height").value;
    ipuz.dimensions.width = document.getElementById("width").value;
    ipuz.solution = []
    ipuz.puzzle = []
    ipuz.author = "Anonymous";
    ipuz.title = "Untitled";
    clueList = {
        "Across": {},
        "Down": {}
    };
    var d = new Date();
    ipuz.copyright = d.getFullYear();
    var num = 0;
    for (y=0; y<ipuz.dimensions.height; y++) {
        ipuz.solution.push([]);
        ipuz.puzzle.push([]);
        clueList.Across[y] = {};
        for (x=0; x<ipuz.dimensions.width; x++) {
            if (y == 0) {
                clueList.Down[x] = {};
            }
            ipuz.solution[y].push("");
            if (x == 0 || y == 0) {
                num += 1;
                ipuz.puzzle[y].push(num);
            } else {
                ipuz.puzzle[y].push(0);
            }
            if (x == 0) {
                ipuz.clues.Across.push([num,""]);
                clueList.Across[y][x] = [num, ""];
            };
            if (y == 0) {
                ipuz.clues.Down.push([num,""]);
                clueList.Down[x][y] = [num, ""]
            };
        };
    };
    drawPuzzle();
    controlVisibility(evt);
    formatClueDivs();
    printClues();
};

var formatClueDivs = function() {
    var height = ipuz.dimensions.height*30-19;
    var acrossTitle = document.getElementById("acrossTitle");
    acrossTitle.innerHTML = "Across";
    var downTitle = document.getElementById("downTitle");
    downTitle.innerHTML = "Down";
    var across = document.getElementById("Across");
    across.style.height = (height)+"px";
    across.style.display = "block";
    var down = document.getElementById("Down");
    down.style.height = (height)+"px";
    down.style.display = "block";
}

var setAttributes = function(domNode, attributes, values) {
    var length = attributes.length;
    for (i=0; i<length; i++) {
        domNode.setAttribute(attributes[i],values[i]);
    };
};

var drawCellContent = function(x,y,evt) {
    var svg = document.getElementById("mainSvg");
    var value = ipuz.solution[y][x];
    var label = ipuz.puzzle[y][x];
    var textId = `text-${x}-${y}`;
    var oldText = document.getElementById(textId);
    if (oldText) {
        svg.removeChild(oldText);
    };
    var numId = `num-${x}-${y}`;
    var oldNum = document.getElementById(numId);
    if (oldNum) {
        svg.removeChild(oldNum);
    };
    var cellId = `cell-${x}-${y}`;
    var inputId = `input-${x}-${y}`;
    var fill = "white";
    if (value == " ") {
        fill = "black";
    } else {
        var text = document.createElementNS(ns, "text");
        text.classList.add("gridContent");
        text.innerHTML = value;
        var textAttributes = ["id","x","y"];
        var textValues = [textId,x*30+20,y*30+20];
        setAttributes(text,textAttributes,textValues);
        text.addEventListener("focus",focusText);
        svg.appendChild(text);
    };
    if (evt) {
        var fObject = document.createElementNS(ns,"foreignObject");
        var fAttributes = ["width","height","x","y"];
        var fValues = [30,30,x*30+2,y*30+2];
        setAttributes(fObject,fAttributes,fValues);
        svg.appendChild(fObject);
        var div = document.createElement("div");
        fObject.appendChild(div);
        var input = document.createElement("input");
        input.classList.add("cellInput");
        var inputAttributes = ["id","width","type","value"];
        var inputValues = [inputId,"100%","text",value];
        setAttributes(input,inputAttributes,inputValues)
        input.addEventListener("blur",updateCell);
        input.addEventListener("keydown",inputKeyDown);
        input.addEventListener("keyup", inputKeyUp);
        input.addEventListener("focus",selectAllText);
        div.appendChild(input);
    };
    if (label == " " || label == 0 || label == "0" || parseInt(label) == 0) {
        label = ""
    }
    var num = document.createElementNS(ns, "text");
    num.classList.add("gridNum");
    var numAttributes = ["id","x","y"];
    var numValues = [numId,10+30*x,10+30*y];
    num.innerHTML = label;
    setAttributes(num,numAttributes,numValues);
    num.addEventListener("focus",focusText);
    svg.appendChild(num);
    var cell = document.getElementById(cellId);
    cell.setAttribute("fill",fill);  
};

var updateNums = function() {
    ipuz.clues = {
        "Across": [],
        "Down": []
    };
    var newClueList = {
        "Across": {},
        "Down": {}
    };
    var num = 0;
    var clue = "";
    for (y=0; y<ipuz.dimensions.height; y++) {
        newClueList.Across[y] = {};
        for (x=0; x<ipuz.dimensions.width; x++) {
            if (y == 0) {
                newClueList.Down[x] = {};
            }
            var numId = `num-${x}-${y}`;
            var label = document.getElementById(numId);
            var value = ipuz.solution[y][x];
            var across = false;
            var down = false;
            if (value == " ") {
                ipuz.puzzle[y][x] = " ";
            } else {
                if (x == 0) {
                    across = true;
                } else if (ipuz.solution[y][x-1] == " ") {
                    across = true;
                };
                if (y == 0) {
                    down = true;
                } else if (ipuz.solution[y-1][x] == " ") {
                    down = true;
                };
                if (across || down) {
                    num += 1;
                    ipuz.puzzle[y][x] = num;
                } else {
                    ipuz.puzzle[y][x] = 0;
                };
                if (across) {
                    if (clueList.Across[y][x]) {
                        clue = clueList.Across[y][x][1];
                    } else {
                        clue = "";
                    }
                    newClueList.Across[y][x] = [num,clue]
                    ipuz.clues.Across.push([num,clue])
                };
                if (down) {
                    if (clueList.Down[x][y]) {
                        clue = clueList.Down[x][y][1];
                    } else {
                        clue = "";
                    };
                    newClueList.Down[x][y] = [num,clue];
                    ipuz.clues.Down.push([num,clue]);
                };
            };
            if (ipuz.puzzle[y][x] != " " && ipuz.puzzle[y][x] != 0) {
                label.innerHTML = ipuz.puzzle[y][x];
            } else {
                label.innerHTML = ""
            }
        };
    };
    clueList = newClueList;
}

var drawPuzzle = function() {
    var height = ipuz.dimensions.height*30+1;
    var width = ipuz.dimensions.width*30+1;
    var svgContainer = document.getElementById("svgContainer");
    svg = document.createElementNS(ns,"svg");
    var svgAttributes = ["id","width","height"];
    var svgValues = ["mainSvg",width+4,height+4];
    setAttributes(svg,svgAttributes,svgValues);
    if (svgContainer.childNodes[0]) {
        svgContainer.replaceChild(svg, svgContainer.childNodes[0]);
    } else {
        svgContainer.appendChild(svg);
    }
    var box = document.createElementNS(ns,"rect");
    box.classList.add("box");
    var boxAttributes = ["width","height","x","y"];
    var boxValues = [width,height,2,2];
    setAttributes(box,boxAttributes,boxValues);
    svg.appendChild(box);
    for (y=0; y<ipuz.dimensions.height; y++) {
        for (x=0; x<ipuz.dimensions.width; x++) {
            var cell = document.createElementNS(ns,"rect");
            cell.classList.add("cell");
            var cellAttributes = ["id","x","y","fill"];
            var cellValues = [`cell-${x}-${y}`,x*30+2.5,y*30+2.5,"white"];
            setAttributes(cell, cellAttributes, cellValues);
            cell.addEventListener("focus", cellInput);
            svg.appendChild(cell);
            drawCellContent(x,y,false);
        };
    };
    document.getElementById("cell-0-0").focus();
};