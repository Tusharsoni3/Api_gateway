import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL, {
    //lazyConnect: true,
    //tls: { rejectUnauthorized: false }
})

redis.on('connect', () => {
    console.log('Redis Connected Successfully')
})

redis.on('error', (err) => {
    console.error('Redis error details:', err.message, err.code)
})

