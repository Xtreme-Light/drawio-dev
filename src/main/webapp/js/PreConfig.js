/**
 * Copyright (c) 2006-2024, JGraph Ltd
 * Copyright (c) 2006-2024, draw.io AG
 */
// Overrides of global vars need to be pre-loaded
window.DRAWIO_PUBLIC_BUILD = true;
window.EXPORT_URL = 'REPLACE_WITH_YOUR_IMAGE_SERVER';
window.PLANT_URL = 'REPLACE_WITH_YOUR_PLANTUML_SERVER';
window.DRAWIO_BASE_URL = null; // Replace with path to base of deployment, e.g. https://www.example.com/folder
window.DRAWIO_VIEWER_URL = null; // Replace your path to the viewer js, e.g. https://www.example.com/js/viewer.min.js
window.DRAWIO_LIGHTBOX_URL = null; // Replace with your lightbox URL, eg. https://www.example.com
window.DRAW_MATH_URL = 'math/es5';
// Replace with your custom draw.io configurations. For more details, https://www.drawio.com/doc/faq/configure-diagram-editor
window.DRAWIO_CONFIG = {
    "defaultLibraries": "basic;flowchart;体系",
    "enabledLibraries": [
        "basic",
        "flowchart",
        "体系"
    ],
    "defaultCustomLibraries": [
        "体系"
    ],
    "appendCustomLibraries": true,
    "libraries": [
        {
            "title": {
                "main": "业务架构"
            },
            "entries": [
                {
                    "id": "体系",
                    "title": {
                        "main": "业务体系",
                        "zh": "业务体系"
                    },
                    "desc": {
                        "main": "业务架构下的第一层级，业务体系",
                        "zh": "业务架构下的第一层级，业务体系"
                    },
                    "libs": [
                        {
                            "title": {
                                "main": "业务体系",
                                "zh": "业务体系"
                            },
                            "data": [
                                {
                                    "xml": "<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"2\" value=\"新增业务\" style=\"rounded=1;whiteSpace=wrap;html=1;\" vertex=\"1\" parent=\"1\"><mxGeometry width=\"120\" height=\"60\" as=\"geometry\"/></mxCell></root></mxGraphModel>",
                                    "w": 120,
                                    "h": 60,
                                    "aspect": "fixed",
                                    "title": "第二个"
                                },
                                {
                                    "xml": "<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"2\" value=\"Text\" style=\"text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;\" vertex=\"1\" parent=\"1\"><mxGeometry width=\"60\" height=\"30\" as=\"geometry\"/></mxCell></root></mxGraphModel>",
                                    "w": 60,
                                    "h": 30,
                                    "title": "第三个"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
urlParams['sync'] = 'manual';
