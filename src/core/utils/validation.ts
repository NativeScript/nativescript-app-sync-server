import { PathReporter } from 'io-ts/PathReporter'
import * as t from 'io-ts'
import { InvalidInputError } from '../app-error'

export const validateAndDecode = <T extends {}>(type: t.Type<T>, data: unknown) => {
  const result = type.decode(data)
  if (result._tag === 'Left') {
    const pathResults = PathReporter.report(result)
    throw new InvalidInputError(JSON.stringify(pathResults))
  }

  return result.right
}