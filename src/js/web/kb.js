import { Keys } from "./keys.js"
import * as Video from "./video.js"
import * as Cartridge from "../prosystem/Cartridge.js"
import * as Events from "../events.js"

var KeyboardMapping = function (leftKey, rightKey, upKey, downKey, b1Key, b2Key) {
  var leftKey = leftKey;
  var defLeftKey = leftKey;
  var rightKey = rightKey;
  var defRightKey = rightKey;
  var upKey = upKey;
  var defUpKey = upKey;
  var downKey = downKey;
  var defDownKey = downKey;
  var b1Key = b1Key;
  var defB1Key = b1Key;
  var b2Key = b2Key;
  var defB2Key = b2Key;

  var leftHeld = false;
  var rightHeld = false;
  var upHeld = false;
  var downHeld = false;
  var b1Held = false;
  var b2Held = false;

  var leftLast = false;
  var upLast = false;

  return {
    /** Sets new defaults (and current values) from a partial mapping */
    setDefaults: function(m) {
      if (m.left != null) { leftKey = defLeftKey = m.left; }
      if (m.right != null) { rightKey = defRightKey = m.right; }
      if (m.up != null) { upKey = defUpKey = m.up; }
      if (m.down != null) { downKey = defDownKey = m.down; }
      if (m.button1 != null) { b1Key = defB1Key = m.button1; }
      if (m.button2 != null) { b2Key = defB2Key = m.button2; }
    },
    getDefaultLeft: function() { return defLeftKey; },
    getLeft: function() { return leftKey; },
    setLeft: function(c) { leftKey = c; },    
    getDefaultRight: function() { return defRightKey; },
    getRight: function() { return rightKey; },
    setRight: function(c) { rightKey = c; },
    getDefaultUp: function() { return defUpKey; },
    getUp: function() { return upKey; },
    setUp: function(c) { upKey = c; },
    getDefaultDown: function() { return defDownKey; },
    getDown: function() { return downKey; },
    setDown: function(c) { downKey = c; },
    getDefaultButton1: function() { return defB1Key; },
    getButton1: function() { return b1Key; },
    setButton1: function(c) { b1Key = c; },
    getDefaultButton2: function() { return defB2Key; },
    getButton2: function() { return b2Key; },
    setButton2: function(c) { b2Key = c; },
    isLeft: function () {
      return (leftHeld && !(rightHeld && !leftLast));
    },
    isRight: function () {
      return (rightHeld && !(leftHeld && leftLast));
    },
    isUp: function () {
      return (upHeld && !(downHeld && !upLast));
    },
    isDown: function () {
      return (downHeld && !(upHeld && upLast));
    },
    isButton1: function () { return b1Held; },
    isButton2: function () { return b2Held; },
    handleKeyCode: function (code, down) {
      switch (code) {
        case leftKey:
          leftHeld = down;
          if (down) leftLast = true;
          return true;
        case upKey:
          upHeld = down;
          if (down) upLast = true;
          return true;
        case rightKey:
          rightHeld = down;
          if (down) leftLast = false;
          return true;
        case downKey:
          downHeld = down;
          if (down) upLast = false;
          return true;
        case b1Key:
          b1Held = down;
          return true;
        case b2Key:
          b2Held = down;
          return true;
      }
      return false;
    },
    reset: function () {
      leftLast = false;
      upLast = false;
    }
  }
}

var p1KeyMap = new KeyboardMapping(
  37, // Left arrow
  39, // Right arrow
  38, // Up arrow
  40, // Down arrow
  90, // Z key
  88  // X key
);

var p2KeyMap = new KeyboardMapping(
  74, // J key
  76, // L key
  73, // I key
  75, // K key
  78, // N key
  77  // M key
);

var resetHeld = false;
var selectHeld = false;
var pauseHeld = false;

var leftDiffSet = false;
var rightDiffSet = false;

/** Cartridge shadow */
var cartridgeLeftSwitch = 1;
var cartridgeRightSwitch = 0;

var f1Code = 112; // F1
var f2Code = 113; // F2
var f3Code = 114; // F3
var f4Code = 115; // F4
var f5Code = 116; // F5
var f6Code = 117; // F6
var f9Code = 120; // F9
var f11Code = 122; // F11

var selectKey = f2Code;
var defSelectKey = selectKey;
var resetKey = f3Code;
var defResetKey = resetKey;
var pauseKey = f4Code;
var defPauseKey = pauseKey;

function setLeftDiffSet(val) {
  leftDiffSet = val;
  Events.fireEvent("onLeftDiffChanged", val);
}

function setRightDiffSet(val) {
  rightDiffSet = val;
  Events.fireEvent("onRightDiffChanged", val);
}

function keyEvent(event, down) {
  var code = event.keyCode;
  var handled = (p1KeyMap.handleKeyCode(code, down) ||
    p2KeyMap.handleKeyCode(code, down));

  if (!handled) {
    switch (code) {
      case resetKey:
        resetHeld = down;
        handled = true;
        break;
      case selectKey:
        selectHeld = down;
        handled = true;
        break;
      case pauseKey:
        pauseHeld = down;
        handled = true;
        break;
      case f5Code:
        if (!down) {
          setLeftDiffSet(leftDiffSet ^= 1);
        }
        handled = true;
        break;
      case f6Code:
        if (!down) {
          setRightDiffSet(rightDiffSet ^= 1);
        }
        handled = true;
        break;
      case f1Code:
        // Ignore F1 keys, annoying to have browser open tab
        handled = true;
        break;
      case f9Code:
      case f11Code:
        if (down) {
          Video.fullScreen();
        }
        handled = true;
        break;
    }
  }

  if (handled && event.preventDefault) {
    event.preventDefault();
  }
}

/** Converts a key code (number) or key name (see Keys) to a key code */
function toKeyCode(key) {
  if (typeof key === "number") {
    return key;
  }
  var name = String(key).toLowerCase();
  for (var code in Keys) {
    if (Keys[code].toLowerCase() === name) {
      return parseInt(code, 10);
    }
  }
  throw "Unknown key: " + key;
}

/**
 * Applies the "keymap" init option, e.g.
 * { p1: { button1: "Space", button2: "Shift" }, p2: {...},
 *   select: "F2", reset: "F3", pause: "F4" }
 */
function applyKeymap(keymap) {
  if (!keymap) {
    return;
  }
  ["p1", "p2"].forEach(function (player) {
    var m = keymap[player];
    if (!m) {
      return;
    }
    var codes = {};
    Object.keys(m).forEach(function (action) {
      codes[action] = toKeyCode(m[action]);
    });
    (player === "p1" ? p1KeyMap : p2KeyMap).setDefaults(codes);
  });
  if (keymap.select != null) { selectKey = defSelectKey = toKeyCode(keymap.select); }
  if (keymap.reset != null) { resetKey = defResetKey = toKeyCode(keymap.reset); }
  if (keymap.pause != null) { pauseKey = defPauseKey = toKeyCode(keymap.pause); }
}

function init(event) {
  applyKeymap(event && event.keymap);

  document.onkeydown =
    function (event) {
      keyEvent(event, true);
    };

  document.onkeyup =
    function (event) {
      keyEvent(event, false);
    };
}

Events.addListener(new Events.Listener("init", init));

function isSelect() {
  return selectHeld
}

function isReset() {
  return resetHeld
}

function isPause() {
  return pauseHeld
}

function isLeftDiffSet() {
  return leftDiffSet
}

function isRightDiffSet() {
  return rightDiffSet
}

function onCartridgeLoaded() {
  cartridgeLeftSwitch = Cartridge.GetLeftSwitch();
  cartridgeRightSwitch = Cartridge.GetRightSwitch();
}

Events.addListener(
  new Events.Listener("onCartridgeLoaded", onCartridgeLoaded));

function reset() {
  // Reset key maps
  p1KeyMap.reset();
  p2KeyMap.reset();

  // Left difficulty switch defaults to off
  setLeftDiffSet(cartridgeLeftSwitch);

  // Right difficulty switch defaults to on
  setRightDiffSet(cartridgeRightSwitch);
}

function setPauseKey(key) {
  pauseKey = key;
}

function getPauseKey() {
  return pauseKey;
}

function setSelectKey(key) {
  selectKey = key;
}

function getSelectKey() {
  return selectKey;
}

function setResetKey(key) {
  resetKey = key;
}

function getResetKey() {
  return resetKey;
}


export {
  isSelect,
  isReset,
  isPause,
  isLeftDiffSet,
  isRightDiffSet,  
  setLeftDiffSet,
  setRightDiffSet,
  reset,
  p1KeyMap,
  p2KeyMap,
  setPauseKey,
  getPauseKey,
  setSelectKey,
  getSelectKey,
  setResetKey,
  getResetKey,
  defResetKey,
  defPauseKey,
  defSelectKey
}
