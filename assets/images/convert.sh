for file in mapshots_tmp/*.jpg
do
	gm convert -resize 1024x1024! -blur 50x4 "$file" "${file/mapshots_tmp/mapshots_out}"
done

