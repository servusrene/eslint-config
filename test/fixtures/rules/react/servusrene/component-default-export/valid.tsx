import type {FC} from 'react';

export type BadgeProps = {
    label: string;
};

export const Tone = {info: 'info', danger: 'danger'} as const;

export const renderBadge = (label: string) => (
    <span>{label}</span>
);

const Badge: FC<BadgeProps> = ({label}) => (
    <span>{label}</span>
);

export default Badge;
