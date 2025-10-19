


/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Evita que Next intente resolver módulos nativos opcionales de 'ws'
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};
    config.resolve.alias['bufferutil'] = false;
    config.resolve.alias['utf-8-validate'] = false;

    // Alternativa equivalente (cualquiera de las dos sirve):
    // config.externals = config.externals || [];
    // config.externals.push({
    //   bufferutil: 'commonjs bufferutil',
    //   'utf-8-validate': 'commonjs utf-8-validate',
    // });

    return config;
  },
  // Por si usas imágenes remotas, fuentes, etc. puedes dejar más opciones acá
};

module.exports = nextConfig;
