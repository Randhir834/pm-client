import React from 'react';

export const lazyWithPreload = (importer) => {
  const Component = React.lazy(importer);
  Component.preload = importer;
  return Component;
};
