import adapter from '@sveltejs/adapter-static';

const base = process.env.BASE_PATH ?? '';

const config = {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: { base }
  }
};

export default config;
