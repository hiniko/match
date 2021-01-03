export default class GameEvents extends Phaser.Events.EventEmitter { 

  private static instance = null

  static get() : GameEvents {
    if(GameEvents.instance === null){
      GameEvents.instance = new GameEvents()
    }
    return GameEvents.instance
  }

  static TILE_CLICKED = "tileClicked"
  static TILE_VALID_SELECTION = "tileValidSelection"
  static TILE_INVALID_SELECTION = "tileInvalidSelection"
  static TILE_DESELECTION = "tileDeselection"
  static TILE_ACCEPT_SELECTION = "tileAcceptSelection"
  static TILE_REMOVE_SELECTION = "tileRemoveSelection"
  static TILE_DROPPED = "tileDropped"

  static BOARD_NEW_ANIMATIONS = "newAnimations"

}
