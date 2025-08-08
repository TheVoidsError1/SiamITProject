const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Position',
    tableName: 'position',
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 36,
            generated: 'uuid',
        },
        position_name_en: { type: 'varchar' },
        position_name_th: { type: 'varchar' },
        new_year_quota: { type: 'boolean', default: false, nullable: false },
    },
    beforeInsert: (entity) => {
        if (!entity.id) {
            entity.id = uuidv4();
        }
    },
})