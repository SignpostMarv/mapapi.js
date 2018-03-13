export function ClassMethodArgumentExpectedClass(obj, method, argNum, expectedClass) {
    const { name: objName } = obj.constructor;
    const { name: className } = expectedClass;

    const func = (obj.constructor === method) ? objName : (`${objName}::${method.name}()`);

    return `Argument ${argNum} passed to ${func} must be an instance of ${className}!`;
}

export function ConstructorArgumentExpectedClass(objectInstance, argNum, expectedClass) {
    return ClassMethodArgumentExpectedClass(objectInstance, objectInstance, argNum, expectedClass);
}

export function ConstructorArgumentGTE(objectInstance, argNum, gte) {
    const { name: objName } = objectInstance.constructor;

    return `Argument ${argNum} passed to ${objName} must be greater or equal to ${gte}`;
}

export function ConstructorArgumentGT(objectInstance, argNum, gt) {
    const { name: objName } = objectInstance.constructor;

    return `Argument ${argNum} passed to ${objName} must be greater than ${gt}`;
}

export function ClassMethodPropertytExpectedType(classObj, name, argNum, expectedType) {
    const { name: objName } = classObj.constructor;

    return `Argument ${argNum} passed to ${objName}::${name} must be a ${expectedType}`;
}

export function ClassMethodArgumentExpectedType(classObj, func, argNum, expectedType) {
    return ClassMethodArgumentExpectedType(classObj, func.name, argNum, expectedType);
}

export function ClassPropertyArgumentGT(classObj, name, argNum, gt) {
    const { name: objName } = classObj.constructor;

    return `Argument ${argNum} passed to ${objName}::${name} must be greater than ${gt}`;
}
