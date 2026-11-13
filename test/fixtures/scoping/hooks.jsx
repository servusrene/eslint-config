import {useState} from 'react';

export const Component = ({enabled}) => {
    if (enabled) {
        useState(1);
    }
    return null;
};
