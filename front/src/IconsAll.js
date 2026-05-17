import React, { useState } from "react";

import * as MdIcons from "react-icons/md";
const IconsAll = (props) => {
    const icons = Object.keys(MdIcons);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">All Icons from react-icons/md</h2>
            <div className="grid grid-cols-4 gap-4">
                {icons.map((iconName, index) => {
                    const IconComponent = MdIcons[iconName]; // Dynamically reference the icon
                    return (
                        <div key={index} className="flex flex-col items-center">
                            <IconComponent className="text-4xl"/>
                            <p className="text-sm mt-2">{iconName}</p>
                        </div>
                    );
                })}
            </div>
        </div>

    );
};

export default IconsAll;
