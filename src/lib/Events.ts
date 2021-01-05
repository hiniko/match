export default class GameEvents extends Phaser.Events.EventEmitter { 

  private static instance = null

  static get() : GameEvents {
    if(GameEvents.instance === null){
      GameEvents.instance = new GameEvents()
    }
    return GameEvents.instance
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

  static BOARD_TILE_CLICKED = "boardTileClicked"
  static BOARD_UPDATE_ANIMATIONS = "boardUpdateAnimations"
  static BOARD_ACCEPT_SELECTION = "boardUpdateSelection"

}
