const IMG = '/images/gallery/optimized';
const IMG_FULL = '/images/gallery/full-res';

const galleryFiles = [
  { file: '_DSC1605-Edit.jpg', span: 'wide' },
  { file: '_DSC1602.jpg', span: 'wide' },
  { file: '_DSC1556.jpg', span: 'tall' },
  { file: '_DSC1675-Edit-2.jpg', span: 'normal' },
  { file: '_DSC1520.jpg', span: 'normal' },
  { file: '_DSC1551.jpg', span: 'normal' },
  { file: '_DSC1690-Edit-2.jpg', span: 'normal' },
  { file: '_DSC1566.jpg', span: 'tall' },
  { file: '_DSC1481.jpg', span: 'wide' },
  { file: '_DSC1431.jpg', span: 'normal' },
  { file: '_DSC1471.jpg', span: 'normal' },
  { file: '_DSC1700.jpg', span: 'normal' },
  { file: '_DSC1705.jpg', span: 'normal' },
];

function img(file) {
  return {
    image: `${IMG}/${file}`,
    imageFull: `${IMG_FULL}/${file}`,
  };
}

module.exports = {
  IMG,
  IMG_FULL,
  hero: img('_DSC1605-Edit.jpg'),
  idea: img('_DSC1602.jpg'),
  experienceMoments: [
    img('_DSC1675-Edit-2.jpg'),
    img('_DSC1602.jpg'),
    img('_DSC1605-Edit.jpg'),
    img('_DSC1556.jpg'),
  ],
  features: img('_DSC1556.jpg'),
  lifestyle: img('_DSC1602.jpg'),
  presentation: { image: `${IMG}/_DSC1431.jpg` },
  thankYou: img('_DSC1690-Edit-2.jpg'),
  galleryFiles: galleryFiles.map(({ file, span }) => ({
    src: `${IMG}/${file}`,
    full: `${IMG_FULL}/${file}`,
    span,
  })),
};
