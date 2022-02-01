import crypto from 'crypto'
import { Stream } from 'stream'
import fs from 'fs'

// Calculate the eTag of the file, the parameter is buffer or readableStream or file path
function getEtag(buffer, callback: (tag: string) => void) {

	// Determine whether the incoming parameter is buffer or stream or filepath
	var mode = 'buffer';

	if (typeof buffer === 'string') {
		buffer = fs.createReadStream(buffer);
		mode = 'stream';
	} else if (buffer instanceof Stream) {
		mode = 'stream';
	}

	// sha1 algorithm
	const sha1 = function (content) {
		var sha1 = crypto.createHash('sha1');
		sha1.update(content);
		return sha1.digest();
	};

	// Divide by 4M
	var blockSize = 4 * 1024 * 1024;
	var sha1String = [];
	var prefix = 0x16;
	var blockCount = 0;

	switch (mode) {
		case 'buffer':
			var bufferSize = buffer.length;
			blockCount = Math.ceil(bufferSize / blockSize);

			for (var i = 0; i < blockCount; i++) {
				// @ts-ignore
				sha1String.push(sha1(buffer.slice(i * blockSize, (i + 1) * blockSize)));
			}
			process.nextTick(function () {
				callback(calcEtag());
			});
			break;
		case 'stream':
			var stream = buffer;
			stream.on('readable', function () {
				var chunk;
				while (chunk = stream.read(blockSize)) {
					// @ts-ignore
					sha1String.push(sha1(chunk));
					blockCount++;
				}
			});
			stream.on('end', function () {
				callback(calcEtag());
			});
			break;
	}

	function calcEtag() {
		if (!sha1String.length) {
			return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ';
		}
		var sha1Buffer = Buffer.concat(sha1String, blockCount * 20);

		// If it is greater than 4M, sha1 the sha1 result of each block again
		if (blockCount > 1) {
			prefix = 0x96;
			sha1Buffer = sha1(sha1Buffer);
		}

		sha1Buffer = Buffer.concat(
			[new Buffer([prefix]), sha1Buffer],
			sha1Buffer.length + 1
		);

		return sha1Buffer.toString('base64')
			.replace(/\//g, '_').replace(/\+/g, '-');

	}

}

export default getEtag;
