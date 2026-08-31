import React from 'react';
import { isImageAvatar } from '../utils/avatarUtils';
import { getAvatarDataUri, PRESET_AVATARS } from '../utils/avatarIcons';

interface AvatarRendererProps {
  avatar?: string | null;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  avatar,
  className = '',
  imageClassName = 'w-full h-full object-cover rounded-full',
  alt = 'Profile Avatar',
}) => {
  const dataUri = getAvatarDataUri(avatar);

  return (
    <img
      src={dataUri}
      alt={alt}
      className={`${imageClassName} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
