module.exports = {
    "parser": "babel-eslint",
    "env": {
        "browser": true,
        "es6": true
    },
    "settings": {
            "ecmascript": 6,
            "jsx": true,
    },
    "parserOptions": {
        "ecmaVersion": 2017,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "experimentalDecorators": true,
            "jsx": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "extends": "airbnb",
    "rules": {
        "react/jsx-filename-extension": 0,
        "max-len": 0,
        "react/jsx-one-expression-per-line": 0,
        "function-paren-newline": 0,
        "import/no-unresolved": 0,
        "consistent-return": 0,
        "react/no-unescaped-entities": 0,
        "react/forbid-prop-types": 0,
        "no-underscore-dangle": 0,
        "jsx-a11y/label-has-for": [ 2, {
            "components": [ "Label" ],
            "required": {
                "some": [ "nesting", "id" ]
            },
            "allowChildren": false,
        }]
    }
};