const SubChunk = require('./sub-chunk')
const EmptySubChunk = require('./empty-sub-chunk')
const BinaryStream = require('jsbinaryutils')

'use strict'

const MaxSubChunks = 16
class Chunk {

    x
    z

    hasChanged = false

    height = MaxSubChunks

    /**
     * @type {Map<number, SubChunk>}
     */
    subChunks = new Map()

    biomes = []

    tiles = []
    entities = []

    heightMap = []

    constructor(chunkX, chunkZ, subChunks = new Map(), entities = new Map(), tiles = new Map(), biomes = [], heightMap = []) {
        this.x = chunkX
        this.z = chunkZ

        for (let y = 0; y < this.height; y++) {
            this.subChunks.set(y, subChunks.has(y) ? subChunks.get(y) : new EmptySubChunk())
        }

        if (heightMap.length === 256) {
            this.height = heightMap
        } else {
            if (heightMap.length !== 0) throw new Error(`Wrong HrightMap value count, expected 256, got ${heightMap.length}`)
            this.heightMap = new Array(256).fill(this.height * 16)
        }

        if (biomes.length === 256) {
            this.biomes = biomes
        } else {
            if (biomes.length !== 0) throw new Error(`Wrong Biomes value count, expected 256, got ${biomes.length}`)
            this.biomes = new Array(256).fill(0x00)
        }
    }

    getChunkX() {
        return this.x
    }

    getChunkZ() {
        return this.z
    }

    static getIdIndex(x, y, z) {
        return (x << 12) | (z << 8) | y
    }

    static getBiomeIndex(x, z) {
        return (z << 4) | x
    }

    static getHeightMapIndex(x, z) {
        return (z << 4) | x
    }

    setBiomeId(x, z, biomeId) {
        this.hasChanged = true
        this.biomes[Chunk.getBiomeIndex(x, z)] = biomeId & 0xff
    }

    setBlockId(x, y, z, id) {
        if (this.getSubChunk(y >> 4, true).setBlockId(x, y & 0x0f, z, id)) {
            this.hasChanged = true
        }
    }

    getSubChunk(y, generateNew = false) {
        if (y < 0 || y >= this.height) {
            return new EmptySubChunk()
        } else if (generateNew && this.subChunks.get(y) instanceof EmptySubChunk) {
            this.subChunks.set(y, new SubChunk())
        }

        return this.subChunks.get(y)
    }

    setHeightMap(x, z, value) {
        this.heightMap[Chunk.getHeightMapIndex(x, z)] = value
    }

    getHighestSubChunkIndex() {
        for (let y = this.subChunks.size - 1; y >= 0; --y) {
            if (this.subChunks.get(y) instanceof EmptySubChunk) {
                continue
            }
            return y
        }

        return -1
    }

    getHighestBlock(x, z) {
        let index = this.getHighestSubChunkIndex()
        if (index === -1) {
            return -1
        }

        for (let y = index; y >= 0; --y) {
            let height = this.getSubChunk(y).getHighestBlockAt(x, z) | (y << 4)
            if (height !== -1) {
                return height
            } 
        }

        return -1
    }

    getSubChunkSendCount() {
        return this.getHighestSubChunkIndex() + 1
    }

    recalculateHeightMap() {
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                this.setHeightMap(x, z, this.getHighestBlock(x, z) + 1)
            }
        }
    }

    toBinary() {
        let stream = new BinaryStream()
        let subChunkCount = this.getSubChunkSendCount()
        for (let y = 0; y < subChunkCount; ++y) {
            stream.append(this.subChunks.get(y).toBinary())
        }
        for (let biome of this.biomes) {
            stream.writeByte(biome)
        }
        stream.writeByte(0)
        return stream.buffer
    }

}
module.exports = Chunk