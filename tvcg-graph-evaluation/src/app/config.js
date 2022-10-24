export const WIDTH = 960;
export const HEIGHT = 960;
export const NUMBER_OF_TIME_SLICES = 4;

export const NODE_SIZE = 8;
export const LINK_LENGTH = 80;

export const TRANSITION_DURATION = 750;

export const ANIMATION_DURATION = 3000;
export const ANIMATION_INCREMENT = 1000;
export const ANIMATION_UPPER_BOUND = 7000;
export const ANIMATION_LOWER_BOUND = 1000;

export const CELL_SIZE = 16;
export const FONT_SIZE = 18;

export const MATRIX_SIZE = {
    WIDTH: 800, // placeholder
    HEIGHT: 800 // placeholder
};

export const NODE_LINK_SIZE = {
    WIDTH: 840, // placeholder
    HEIGHT: 640 // placeholder
};

export const SIMULATION_CONFIGURATION = {
    LINK_DISTANCE: 30, 
    LINK_STRENGTH: .25, 
    NODE_STRENGTH: .25, 
    MANYBODY_STRENGTH: -150, 
    CENTER_STRENGTH: 0.25,
    ALPHA: 0.6,
    ALPHA_MIN: 0.3001,
    ALPHA_DECAY: 0.05,
    ALPHA_TARGET: 0.3, //(ALPHA_TARGET - ALPHA)*ALPHA_DECAY
    VELOCITY_DECAY: 0.125,
};

export const DISPLAY_CONFIGURATION = {
    LINK_WIDTH: 1,
    LINK_OPACITY_DEFAULT: 1,
    LINK_OPACITY_HIDDEN: 0, 
    LINK_OPACITY_FADED: 0.25, 
    NODE_RADIUS: 6, 
    NODE_BORDER: 1, 
    ROW_COL_HIGHLIGHT_COLOR: '#ff0000', 
    CELL_BORDER_SIZE: 1, 
    CELL_SIZE: 16 
};

export const SVG_MARGIN = {
    top: 65, 
    right: 20, 
    bottom: 20, 
    left: 50
};