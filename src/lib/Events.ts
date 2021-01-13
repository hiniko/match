interface DeferredEvent {
  name: string,
  callback: (...args: any[]) => void
  callbackContext: any
  args: any[]
}
export default class GameEvents extends Phaser.Events.EventEmitter {  

  private static instance = null
  private deferred: DeferredEvent[] = []

  static get() : GameEvents {
    if(GameEvents.instance === null){
      GameEvents.instance = new GameEvents()
    }
    return GameEvents.instance
  }

  defer(event: DeferredEvent) {
    this.deferred.push(event)
    
  }

  checkDeferred() {
    console.log("Checking for deferred events")
    if(this.deferred.length < 1) return;
    let event = this.deferred.pop()
    console.warn("Calling deferred event:" + event.name)
    let callback = event.callback.bind(event.callbackContext, event.args)
    callback()
  }

  emit(event: string | symbol, ...args: any[]): boolean{
    //console.log("emitted " + event.toString())
    return super.emit(event, ...args)
  }

  static LOGIC_UPDATE_SELECTION = "logicUpdateSelection"
  static LOGIC_UNSELECTION = "logicUnselection"
  static LOGIC_VALID_SELECTION = "logicValidSelection"
  static LOGIC_INVALID_SELECTION = "logicInvalidSelection"
  static LOGIC_BOARD_UPDATED = "logicTilesUpdated"
  static LOGIC_ACCEPT_SELECTION = "logicAcceptSelection"
  static LOGIC_CLEAR_SELECTION = "logicClearSelection"

  static BOARD_UPDATE_ANIMATIONS = "boardUpdateAnimations"
  static BOARD_ACCEPT_SELECTION = "boardUpdateSelection"

  static TILE_CLICKED = "tileClicked"
  static TILE_POINTER_OVER= "tilePointerOver"
  static TILE_POINTER_OUT = "tilePointerOut"

  static OPS_BUTTON_CLICKED = "opsButtonClicked"
  static OPS_BUTTON_POINTER_OVER = "opsbuttonOver"
  static OPS_BUTTON_POINTER_OUT = "opsbuttonOut"
  static OPS_PANEL_HIDE = "opsPanelHide"
  static OPS_PANEL_SELECTED = "opsPanelSelected"

}
