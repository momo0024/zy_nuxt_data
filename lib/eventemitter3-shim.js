import * as EmitterModule from 'eventemitter3-original'

const EventEmitter = EmitterModule.default ?? EmitterModule

export default EventEmitter
export { EventEmitter }
