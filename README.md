# core

package.json to use core package

```json
{
	"name": "gezcez",
	"private": true,
	"workspaces": ["core"]
}
```

also dont forget to add

```json

"dependencies": {
   "@gezcez/core":"workspace:core",
}
```
to consumer's package.json