// Adapted from Google V8 Engine: 
// https://github.com/v8/v8/blob/dae6dfe08ba9810abbe7eee81f7c58e999ae8525/src/math.js#L144
export class Random {
    constructor(seed = new Date().getTime()) {
        this._setRngstate(seed);
    }

    // Seed can be a string
    _setRngstate(seed) {
        // No good way in JS to determine if a string is a valid number
        if (/^-?\d{1,10}$/.test(seed) && seed >= -0x80000000 && seed <= 0x7FFFFFFF) {
            seed = parseInt(seed);
        } else {
            seed = this._hashCode(seed);
        }
        this._rngstate = [seed & 0xFFFF, seed >>> 16];
    }

    // Borrowed from Java
    _hashCode(str) {
        let hash = 0;
        // Strings in JS are UTF-16 encoded
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
        }
        return hash;
    }

    // Returns a random number in [0, 1)
    random() {
        const r0 = (Math.imul(18030, this._rngstate[0] & 0xFFFF) + (this._rngstate[0] >>> 16)) | 0;
        this._rngstate[0] = r0;
        const r1 = (Math.imul(36969, this._rngstate[1] & 0xFFFF) + (this._rngstate[1] >>> 16)) | 0;
        this._rngstate[1] = r1;
        const x = ((r0 << 16) + (r1 & 0xFFFF)) | 0;
        // Division by 0x100000000 through multiplication by reciprocal
        return (x < 0 ? x + 0x100000000 : x) * 2.3283064365386962890625e-10;
    }

    // Returns an integer in [min, max]
    randint(min, max) {
        return Math.floor(min + this.random() * (max - min + 1));
    }
}

// Generates a random sequence in [0, length) such that each call to next() returns a value not previously returned, until exhausted
export class RandomSequence {
    constructor(length, seed) {
        this._rng = new Random(seed);
        this._list = Array.from({ length }, (_, i) => i);
        this._nextMin = 0;
    }

    next() {
        if (this._nextMin >= this._list.length) {
            this._nextMin = 0;
        }
        const index = this._rng.randint(this._nextMin, this._list.length - 1);
        const result = this._list[index];
        [this._list[index], this._list[this._nextMin]] = [this._list[this._nextMin], this._list[index]];
        this._nextMin++;
        return result;
    }
}
