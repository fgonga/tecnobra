/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

import {CustomShowDTO, PaginationRequestDto} from "../dtos/index";

export class BaseCrudService<TModel> {
    protected model: TModel

    constructor(model: TModel) {
        this.model = model
    }
    async index(data: PaginationRequestDto): Promise<any> {
        // @ts-ignore
        return await this.model.paginate(data)
    }

    async store(data: any): Promise<any> {
        // @ts-ignore
        return await this.model.create(data)
    }

    async show(data: CustomShowDTO): Promise<any> {
        // @ts-ignore
        return await this.model.findOneById(data)
    }

    async delete(id: number): Promise<boolean> {
        // @ts-ignore
        return await this.model.delete(id)
    }

    async update(id: number, data: any): Promise<boolean> {
        // @ts-ignore
        return await this.model.update(id, data)
    }
}
