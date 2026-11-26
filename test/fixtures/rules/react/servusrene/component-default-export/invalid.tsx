import type {FC} from 'react';

type BadgeProps = {
    label: string;
};

export const Badge: FC<BadgeProps> = ({label}) => (
    <span>{label}</span>
);
