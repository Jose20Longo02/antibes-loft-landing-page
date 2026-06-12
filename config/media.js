const IMG = '/images/gallery/display';
const IMG_LIGHTBOX = '/images/gallery/lightbox';

function fileBase(file) {
  return file.replace(/\.jpe?g$/i, '');
}

const galleryFiles = [
  { file: '_DSC1605-Edit.jpg', span: 'wide' },
  { file: 'IMG_2855.jpg', span: 'wide' },
  { file: '_DSC1602.jpg', span: 'wide' },
  { file: '_DSC1556.jpg', span: 'tall' },
  { file: 'IMG_2863.jpg', span: 'normal' },
  { file: '_DSC1675-Edit-2.jpg', span: 'normal' },
  { file: '_DSC1520.jpg', span: 'normal' },
  { file: 'IMG_2883.jpg', span: 'wide' },
  { file: '_DSC1551.jpg', span: 'normal' },
  { file: '_DSC1690-Edit-2.jpg', span: 'normal' },
  { file: 'IMG_2882.jpg', span: 'wide' },
  { file: '_DSC1566.jpg', span: 'tall' },
  { file: '_DSC1481.jpg', span: 'wide' },
  { file: '_DSC1431.jpg', span: 'normal' },
  { file: '_DSC1471.jpg', span: 'normal' },
  { file: '_DSC1700.jpg', span: 'normal' },
  { file: '_DSC1705.jpg', span: 'normal' },
];

function img(file) {
  const base = fileBase(file);
  return {
    image: `${IMG}/${file}`,
    imageWebp: `${IMG}/${base}.webp`,
    image960: `${IMG}/${base}-960.jpg`,
    image960Webp: `${IMG}/${base}-960.webp`,
    imageFull: `${IMG_LIGHTBOX}/${file}`,
    imageFullWebp: `${IMG_LIGHTBOX}/${base}.webp`,
  };
}

const VIDEO = '/videos';

module.exports = {
  IMG,
  IMG_LIGHTBOX,
  VIDEO,
  hero: img('_DSC1605-Edit.jpg'),
  film: {
    poster: '/images/film/poster.jpg',
    posterWebp: '/images/film/poster.webp',
    videoCompressed: `${VIDEO}/villa-antibes-compressed.mp4`,
    videoHd: `${VIDEO}/villa-antibes-hd.mp4`,
  },
  idea: img('_DSC1602.jpg'),
  experienceMoments: [
    img('_DSC1675-Edit-2.jpg'),
    img('_DSC1602.jpg'),
    img('_DSC1605-Edit.jpg'),
    img('_DSC1556.jpg'),
  ],
  features: img('_DSC1556.jpg'),
  lifestyle: img('_DSC1602.jpg'),
  presentation: img('_DSC1431.jpg'),
  thankYou: img('_DSC1690-Edit-2.jpg'),
  galleryFiles: galleryFiles.map(({ file, span }) => {
    const base = fileBase(file);
    return {
      src: `${IMG}/${file}`,
      webp: `${IMG}/${base}.webp`,
      full: `${IMG_LIGHTBOX}/${file}`,
      fullWebp: `${IMG_LIGHTBOX}/${base}.webp`,
      span,
    };
  }),
};
