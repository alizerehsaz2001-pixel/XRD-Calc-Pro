import zlib
import os

filepath = 'components/DeepLearningModule.tsx'

with open(filepath, 'rb') as f:
    data = f.read()

idx = data.find(b'x\x9c')
if idx != -1:
    print('Found zlib signature at', idx)
    prefix = data[:idx]
    suffix = data[idx:]
    
    d = zlib.decompressobj()
    try:
        uncompressed = d.decompress(suffix)
        print('Chunk 1 uncompressed size:', len(uncompressed))
        if d.unused_data:
            d2 = zlib.decompressobj()
            u2 = d2.decompress(d.unused_data)
            print('Chunk 2 uncompressed size:', len(u2))
            uncompressed += u2
            
        full = prefix + uncompressed
        with open(filepath, 'wb') as out:
            out.write(full)
        print('Successfully wrote fixed file. Total size:', len(full))
    except Exception as e:
        print('Failed to decompress:', e)
else:
    print('No zlib signature found. File might not be corrupted in the same way.')
