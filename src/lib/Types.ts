export enum Position{
    Top,
    Right,
    Bottom,
    Left
}

export class Neighbour {
   side :Position 
   boardIdx: integer
}

export enum Layout {
    Vertical,
    Horizontal
}