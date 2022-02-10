import crypto from 'crypto'
import { Readable, Stream } from 'stream'
import fs from 'fs'
import { range } from 'ramda'

// Calculate the eTag of the file, the parameter is buffer or readableStream or file path
function getEtag(data: string | Stream | Buffer): Promise<string> {
	return new Promise((resolve, reject) => { 
	// Determine whether the incoming parameter is buffer or stream or filepath
	const getMode = (bufferData: string | Stream | Buffer): Stream | Buffer => {
		if (typeof bufferData === 'string') {
			return fs.createReadStream(bufferData)
		}
		return bufferData
	}

	const buffer = getMode(data)

	// Divide by 4M
	const blockSize = 4 * 1024 * 1024
	const prefix = 0x16

	if (buffer instanceof Stream) {
		let blockCount = 0
		const sha1String: Buffer[] = []
		const stream = buffer
	
		stream.on('readable', function() {
			let chunk;
			while (chunk = (stream as Readable).read(blockSize)) {
				sha1String.push(sha1(chunk));
				blockCount++;
			}
		})

		stream.on('end', function () {
			resolve(calcEtag(sha1String, blockCount, prefix));
		})
	}
	else if (buffer instanceof Buffer) {
		const bufferSize = buffer.length;
		const blockCount = Math.ceil(bufferSize / blockSize);

		const sha1String = range(0, blockCount).map(i => {
			return sha1(buffer.slice(i * blockSize, (i + 1) * blockSize))
		})

		process.nextTick(function () {
			resolve(calcEtag(sha1String, blockCount, prefix));
		});
	}
})
}

// sha1 algorithm
const sha1 = function (content: crypto.BinaryLike) {
	const sha1 = crypto.createHash('sha1');
	sha1.update(content);
	return sha1.digest();
}

function calcEtag(sha1String: Buffer[], blockCount: number, prefixParam: 22) {
	if (!sha1String.length) {
		return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ';
	}

	// If it is greater than 4M, sha1 the sha1 result of each block again
	const sha1Raw = Buffer.concat(sha1String, blockCount * 20);
	const sha1Buffer = blockCount > 1 ? sha1(sha1Raw) : sha1Raw

	const prefix = blockCount > 1 ? 0x96 : prefixParam


	const sha1BufferWithPrefix = Buffer.concat(
		[Buffer.from([prefix]), sha1Buffer],
		sha1Buffer.length + 1
	);

	return sha1BufferWithPrefix.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}

export default getEtag;
