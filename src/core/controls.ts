import {EnhancedDOMPoint} from "@/engine/enhanced-dom-point";

const enum XboxControllerButton {
  A,
  B,
  X,
  Y,
  LeftBumper,
  RightBumper,
  LeftTrigger,
  RightTrigger,
  Select,
  Start,
  L3,
  R3,
  DpadUp,
  DpadDown,
  DpadLeft,
  DpadRight,
}

class Controls {
  inputDirection = new EnhancedDOMPoint();
  cameraDirection = new EnhancedDOMPoint();
  mouseMovement = new EnhancedDOMPoint();
  isJump? = false;
  isPrevJump? = false;
  isGallop? = false;
  isConfirm ? = false;

  keyMap: Map<string, boolean> = new Map();

  isEnabled_ = false;

  padIndex: number | null = null;
  gamepad: Gamepad | null = null;

  leftStickMagnitude = 0;

  platformMappings = {
    jump: 0,
    rightAnalogY: 3,
  }

  constructor() {
    document.addEventListener('keydown', event => this.toggleKey(event, true));
    document.addEventListener('keyup', event => this.toggleKey(event, false));

    window.addEventListener("mousemove", (e) => {
      this.mouseMovement.x += e.movementX * 0.05;
      this.mouseMovement.y += e.movementY * 0.05;
    });
  }

  enableControls() {
    this.isEnabled_ = true;
    this.mouseMovement.set(0,0,0);
  }

  queryController() {
    if (!this.isEnabled_) {
      return;
    }

    this.isPrevJump = this.isJump;
    const gamepads = navigator.getGamepads();
    if (gamepads) {
      if (this.padIndex === null) {
        gamepads.forEach(pad => {
          if (pad?.buttons.some(button => button.pressed)) {
            this.padIndex = pad ? pad.index : null;
            if (pad?.mapping === '' && navigator.userAgent.includes('refox')) {
              this.platformMappings.jump = 1;
              if (navigator.userAgent.includes('Win')) {
                this.platformMappings.rightAnalogY = 5;
              }
            }
          }
        })
      } else {
        this.gamepad = gamepads[this.padIndex];
      }

    }
    const isButtonPressed = (button: XboxControllerButton) => this.gamepad?.buttons[button]?.pressed;

    const leftVal = (this.keyMap.get('KeyA') || isButtonPressed(XboxControllerButton.DpadLeft)) ? -1 : 0;
    const rightVal = (this.keyMap.get('KeyD') || isButtonPressed(XboxControllerButton.DpadRight)) ? 1 : 0;
    const upVal = (this.keyMap.get('KeyW') || isButtonPressed(XboxControllerButton.DpadUp)) ? -1 : 0;
    const downVal = (this.keyMap.get('KeyS') || isButtonPressed(XboxControllerButton.DpadDown)) ? 1 : 0;
    this.inputDirection.x = (leftVal + rightVal) || this.gamepad?.axes[0] || 0;
    this.inputDirection.y = (upVal + downVal) || this.gamepad?.axes[1] || 0;
    this.cameraDirection.x = this.mouseMovement.x || this.gamepad?.axes[2] || 0;
    this.cameraDirection.y = this.mouseMovement.y || this.gamepad?.axes[this.platformMappings.rightAnalogY] || 0;
    this.isJump = this.keyMap.get('Space') || isButtonPressed(this.platformMappings.jump);
    this.isGallop = this.keyMap.get('ShiftLeft') || isButtonPressed(2) || isButtonPressed(XboxControllerButton.RightTrigger);
    this.isConfirm = this.keyMap.get('Enter') || isButtonPressed(XboxControllerButton.Start);

    this.leftStickMagnitude = this.inputDirection.magnitude;

    const deadzone = 0.2;
    if (this.leftStickMagnitude < deadzone) {
      this.leftStickMagnitude = 0;
      this.inputDirection.x = 0;
      this.inputDirection.y = 0;
    }

    if (this.leftStickMagnitude > 1) {
      this.inputDirection.normalize_();
    }

    if (this.cameraDirection.magnitude < deadzone) {
      this.cameraDirection.set(0, 0, 0);
    }

    this.mouseMovement.set(0, 0);
  }

  private toggleKey(event: KeyboardEvent, isPressed: boolean) {
    this.keyMap.set(event.code, isPressed);
  }
}

export const controls = new Controls();
