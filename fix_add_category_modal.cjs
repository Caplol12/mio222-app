const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const addCategoryModalStr = `      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />`;

const addBookmarkModalStr = `<AddBookmarkModal
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBookmarkToEdit(null);
        }}
        onSave={handleSaveBookmark}
        bookmarkToEdit={bookmarkToEdit}
        activeCategory={activeCategory}
      />`;

if (code.includes(addCategoryModalStr)) {
  console.log("Already added");
} else if (code.includes(addBookmarkModalStr)) {
  code = code.replace(addBookmarkModalStr, addBookmarkModalStr + "\n" + addCategoryModalStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Added AddCategoryModal");
} else {
  console.log("Could not find AddBookmarkModal to replace.");
}
