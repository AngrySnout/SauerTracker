/* eslint-disable max-len,eqeqeq,no-bitwise,radix */
const cube2unichars =
[
	0, 192, 193, 194, 195, 196, 197, 198, 199, 9, 10, 11, 12, 13, 200, 201,
	202, 203, 204, 205, 206, 207, 209, 210, 211, 212, 213, 214, 216, 217, 218, 219,
	32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
	48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
	64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
	80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
	96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
	112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 220,
	221, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237,
	238, 239, 241, 242, 243, 244, 245, 246, 248, 249, 250, 251, 252, 253, 255, 0x104,
	0x105, 0x106, 0x107, 0x10C, 0x10D, 0x10E, 0x10F, 0x118, 0x119, 0x11A, 0x11B, 0x11E, 0x11F, 0x130, 0x131, 0x141,
	0x142, 0x143, 0x144, 0x147, 0x148, 0x150, 0x151, 0x152, 0x153, 0x158, 0x159, 0x15A, 0x15B, 0x15E, 0x15F, 0x160,
	0x161, 0x164, 0x165, 0x16E, 0x16F, 0x170, 0x171, 0x178, 0x179, 0x17A, 0x17B, 0x17C, 0x17D, 0x17E, 0x404, 0x411,
	0x413, 0x414, 0x416, 0x417, 0x418, 0x419, 0x41B, 0x41F, 0x423, 0x424, 0x426, 0x427, 0x428, 0x429, 0x42A, 0x42B,
	0x42C, 0x42D, 0x42E, 0x42F, 0x431, 0x432, 0x433, 0x434, 0x436, 0x437, 0x438, 0x439, 0x43A, 0x43B, 0x43C, 0x43D,
	0x43F, 0x442, 0x444, 0x446, 0x447, 0x448, 0x449, 0x44A, 0x44B, 0x44C, 0x44D, 0x44E, 0x44F, 0x454, 0x490, 0x491,
];
const uni2cubeoffsets =
[
	0, 256, 658, 658, 512, 658, 658, 658,
];
const uni2cubechars =
[
	0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 10, 11, 12, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
	64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
	96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 19, 20, 21, 0, 22, 23, 24, 25, 26, 27, 0, 28, 29, 30, 31, 127, 128, 0, 129,
	130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 0, 146, 147, 148, 149, 150, 151, 0, 152, 153, 154, 155, 156, 157, 0, 158,
	0, 0, 0, 0, 159, 160, 161, 162, 0, 0, 0, 0, 163, 164, 165, 166, 0, 0, 0, 0, 0, 0, 0, 0, 167, 168, 169, 170, 0, 0, 171, 172,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 173, 174, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 175, 176, 177, 178, 0, 0, 179, 180, 0, 0, 0, 0, 0, 0, 0, 181, 182, 183, 184, 0, 0, 0, 0, 185, 186, 187, 188, 0, 0, 189, 190,
	191, 192, 0, 0, 193, 194, 0, 0, 0, 0, 0, 0, 0, 0, 195, 196, 197, 198, 0, 0, 0, 0, 0, 0, 199, 200, 201, 202, 203, 204, 205, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 17, 0, 0, 206, 83, 73, 21, 74, 0, 0, 0, 0, 0, 0, 0, 65, 207, 66, 208, 209, 69, 210, 211, 212, 213, 75, 214, 77, 72, 79, 215,
	80, 67, 84, 216, 217, 88, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 97, 228, 229, 230, 231, 101, 232, 233, 234, 235, 236, 237, 238, 239, 111, 240,
	112, 99, 241, 121, 242, 120, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 0, 141, 0, 0, 253, 115, 105, 145, 106, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 254, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const cube2colors = ['#40ff80', '#60a0ff', '#ffc040', '#ff4040', '#808080', '#c040c0', '#ff8000', 'white', 'cyan', 'black'];

/**
 *  Convert Cube 2 string to its UTF8 equivalent.
 *  @param {string} str - The Cube 2 string to process.
 *  @returns {string} The UTF8 string.
 */
export function cube2uni(str) {
	let res = '';
	for (let i = 0; i < str.length; i++) res += String.fromCharCode(cube2unichars[str[i].charCodeAt()]);
	return res;
}

/**
 *  Convert UTF8 string to its Cube 2 equivalent.
 *  @param {string} str - The UTF8 string to process.
 *  @returns {string} The Cube 2 string.
 */
export function uni2cube(str) {
	let res = '';
	for (let i = 0; i < str.length; i++) {
		const c = str[i].charCodeAt();
		res += String.fromCharCode((c <= 0x7FF) ? uni2cubechars[uni2cubeoffsets[c >> 8] + (c & 0xFF)] : 0);
	}
	return res;
}

/**
 *  Filter formatting characters from string.
 *  @param {string} str - The string to filter.
 *  @returns {string} Filtered string.
 */
export function filterString(str) {
	let res = '';
	for (let i = 0; i < str.length; i++) {
		if (str[i] == '\f') i++;
		else res += str[i];
	}
	return res;
}

// https://github.com/janl/mustache.js/blob/master/mustache.js#L60
const entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;',
};
export function escapeHtml(string) {
	return String(string).replace(/[&<>"'`=/]/g, s => entityMap[s]);
}

/**
 *  Convert string formatting characters to colored HTML.
 *  @param {string} str - The string to convert.
 *  @returns {string} HTML string.
 */
export function cube2colorHTML(str) {
	str = escapeHtml(str);
	let res = '';
	let inSpan = false;
	if (str.length && str[0] != '\f') {
		res += '<span style="color: lightgrey">';
		inSpan = true;
	}
	let curc = -1;
	let savedc = -1;
	for (let i = 0; i < str.length; i++) {
		if (str[i] == '\f') {
			let cl = str[++i];
			if (cl == 's') savedc = curc;
			else {
				if (cl == 'r') cl = savedc || 'lightgrey';
				if (curc != cl) {
					if (inSpan) res += '</span>';
					res += `<span style="color: ${cube2colors[cl]}">`;
					inSpan = true;
				}
				curc = cl;
			}
		} else {
			res += str[i];
		}
	}
	if (inSpan) {
		res += '</span>';
		inSpan = false;
	}
	return res;
}

/**
 *  Provides utility functions for working with Cube 2 packets.
 *  @class Packet
 */
export default class Packet {
	/**
	 *  @constructor
	 *  @param {buffer} buffer - The buffer object to use.
	 *  @param {number} offset - Offset of the buffer.
	*/
	constructor(buffer, offset) {
		this.buffer = buffer;
		this.offset = offset || 0;
	}

	/**
	 *  Read next integer.
	 *  @returns {number} The integer.
	 */
	getInt() {
		const ch = this.buffer.readInt8(this.offset);
		let res;
		if (ch == -128) {
			res = this.buffer.readUInt8(this.offset + 1) | (this.buffer.readInt8(this.offset + 2) << 8);
			this.offset += 3;
		} else if (ch == -127) {
			res = this.buffer.readUInt8(this.offset + 1) | (this.buffer.readUInt8(this.offset + 2) << 8) | (this.buffer.readUInt8(this.offset + 3) << 16) | (this.buffer.readInt8(this.offset + 4) << 24);
			this.offset += 5;
		} else {
			res = ch;
			this.offset++;
		}
		return res;
	}

	/**
	 *  Write an integer.
	 *  @param {number} num - The number to write.
	 */
	putInt(num) {
		num = parseInt(num);
		if (num < 128 && num > -127) {
			this.buffer.writeUInt8(num & 0xFF, this.offset);
			this.offset++;
		} else if (num < 0x8000 && num >= -0x8000) {
			this.buffer.writeUInt8(0x80, this.offset);
			this.buffer.writeUInt8(num & 0xFF, this.offset + 1);
			this.buffer.writeUInt8((num >> 8) & 0xFF, this.offset + 2);
			this.offset += 3;
		} else {
			this.buffer.writeUInt8(0x81, this.offset);
			this.buffer.writeUInt8((num) & 0xFF, this.offset + 1);
			this.buffer.writeUInt8((num >> 8) & 0xFF, this.offset + 2);
			this.buffer.writeUInt8((num >> 16) & 0xFF, this.offset + 3);
			this.buffer.writeUInt8((num >> 24) & 0xFF, this.offset + 4);
			this.offset += 5;
		}
	}

	/**
	 *  Read next string.
	 *  @returns {string} The string.
	 */
	getString() {
		let res = '';
		while (this.offset < this.buffer.length && this.buffer[this.offset] !== 0) {
			res += String.fromCharCode(this.getInt() & 0xFF);
		}
		this.offset++;
		return cube2uni(res).replace(/\x00/g, ''); // eslint-disable-line no-control-regex
	}

	/**
	 *  Write a string.
	 *  @param {string} str - The string to write.
	 */
	putString(str) {
		const lastoffset = this.offset;
		const cubestr = uni2cube(str);
		let i = 0;
		while (i < cubestr.length) {
			this.putInt(cubestr[i++].charCodeAt());
		}
		this.putInt(0);
		return this.offset - lastoffset;
	}

	/**
	 *  Get number of remaining bytes in buffer.
	 *  @returns {number}
	 */
	remaining() {
		return this.buffer.length - this.offset;
	}

	/**
	 *  Check whether the end of the buffer is reached.
	 *  @returns {boolean}
	 */
	overread() {
		return this.buffer.length <= this.offset;
	}

	/**
	 *  Get a sliced/trimmed buffer, eg for sending over the network.
	 *  @returns {buffer}
	 */
	finalize() {
		return this.buffer.slice(0, this.offset);
	}
}
